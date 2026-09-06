#!/usr/bin/env python3
"""
Serenify Audio Pipeline -- Production CLI Wrapper with Speech-Aware Chunked ASR

This is the production CLI interface for Serenify. It performs acoustic signal
normalization, extracts clinical biomarkers over the full original recording,
and handles long-form speech transcription via speech-aware chunking (~15s)
to prevent IndicConformer degradation observed on long continuous audio.

Key Production Characteristics:
1. Biomarker Integrity: Acoustic biomarkers (response latency, hesitation pauses,
   speaking duration) are computed exclusively on the full un-chunked audio.
2. Speech-Aware Chunking: Chunks target ~15 seconds and are bounded at natural
   silence/pause points (>= 300 ms) to preserve phonetic and linguistic context.
3. Model Reuse: The loaded IndicConformer ASR model is cached and reused across
   all chunk inferences via AudioAssessmentPipeline.transcribe().
4. Output Contract: Produces the exact Serenify JSON contract with no chunk
   metadata or internal benchmark artifacts exposed downstream.
"""

import argparse
import contextlib
import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Tuple

import soundfile as sf
import torch

# Ensure sibling import resolves correctly regardless of execution directory
sys.path.insert(0, str(Path(__file__).resolve().parent))
from audio_pipeline import AudioAssessmentPipeline


@contextlib.contextmanager
def suppress_all_output_unless_error(log_path: str):
    """
    Redirects stdout and stderr at the operating-system file-descriptor level.
    This catches low-level C++/CUDA logs, NeMo engine diagnostics, and tqdm
    progress bars. If an uncaught exception occurs, the captured log is dumped
    to the terminal before propagating.
    """
    stdout_fd = sys.stdout.fileno()
    stderr_fd = sys.stderr.fileno()
    saved_stdout_fd = os.dup(stdout_fd)
    saved_stderr_fd = os.dup(stderr_fd)

    with open(log_path, "w", encoding="utf-8") as log_file:
        os.dup2(log_file.fileno(), stdout_fd)
        os.dup2(log_file.fileno(), stderr_fd)
        try:
            yield
        except Exception:
            os.dup2(saved_stdout_fd, stdout_fd)
            os.dup2(saved_stderr_fd, stderr_fd)
            print("\n--- An error occurred. Captured diagnostic log: ---\n")
            with open(log_path, "r", encoding="utf-8") as f:
                print(f.read())
            print("--- End of diagnostic log ---\n")
            raise
        finally:
            os.dup2(saved_stdout_fd, stdout_fd)
            os.dup2(saved_stderr_fd, stderr_fd)
            os.close(saved_stdout_fd)
            os.close(saved_stderr_fd)


class ProductionChunkedProcessor:
    def __init__(
        self,
        target_chunk_sec: float = 15.0,
        min_chunk_sec: float = 10.0,
        max_chunk_sec: float = 26.0,
    ):
        """
        Initializes processor with empirically verified 15-second target chunking.
        The underlying AudioAssessmentPipeline handles model loading, caching,
        and CTC -> RNNT fallback mechanisms.
        """
        self.pipeline = AudioAssessmentPipeline()
        self.target_chunk_sec = target_chunk_sec
        self.min_chunk_sec = min_chunk_sec
        self.max_chunk_sec = max_chunk_sec

    def _find_candidate_cut_points(
        self,
        waveform: torch.Tensor,
        sr: int,
        frame_ms: float = 25.0,
        baseline_ms: float = 300.0,
        min_pause_ms: float = 300.0,
    ) -> List[float]:
        """
        Detects midpoints of natural pauses (>= 300 ms) using adaptive RMS energy.
        Note: This 300 ms threshold is used strictly for locating safe segmentation
        boundaries, distinct from the 750 ms hesitation-pause biomarker.
        """
        frame_size = int(sr * frame_ms / 1000)
        num_frames = waveform.shape[1] // frame_size
        if num_frames < 10:
            return []

        trimmed = waveform[:, : num_frames * frame_size]
        frames = trimmed.reshape(num_frames, frame_size)
        frame_rms = torch.sqrt((frames ** 2).mean(dim=1))

        baseline_frames = min(max(1, int(baseline_ms / frame_ms)), num_frames)
        baseline_rms = frame_rms[:baseline_frames].mean()
        threshold = torch.clamp(baseline_rms * 3.0, min=0.01)

        is_speech = frame_rms > threshold
        min_pause_frames = int((min_pause_ms / 1000) * sr / frame_size)

        pause_midpoints: List[float] = []
        current_silence = 0
        silence_start = 0

        for i in range(num_frames):
            if not is_speech[i]:
                if current_silence == 0:
                    silence_start = i
                current_silence += 1
            else:
                if current_silence >= min_pause_frames:
                    mid_frame = silence_start + (current_silence // 2)
                    pause_midpoints.append(mid_frame * frame_size / sr)
                current_silence = 0

        if current_silence >= min_pause_frames:
            mid_frame = silence_start + (current_silence // 2)
            pause_midpoints.append(mid_frame * frame_size / sr)

        return pause_midpoints

    def _plan_chunks(
        self,
        total_duration_sec: float,
        candidate_cut_points: List[float],
    ) -> List[Tuple[float, float]]:
        """
        Calculates chunk start and end boundaries, favoring nearby natural
        pauses over cutting through continuous speech.
        """
        if total_duration_sec <= self.max_chunk_sec:
            return [(0.0, round(total_duration_sec, 3))]

        chunks: List[Tuple[float, float]] = []
        current_start = 0.0

        while current_start < total_duration_sec:
            remaining = total_duration_sec - current_start
            if remaining <= self.max_chunk_sec:
                chunks.append((round(current_start, 3), round(total_duration_sec, 3)))
                break

            ideal = current_start + self.target_chunk_sec
            min_cut = current_start + self.min_chunk_sec
            max_cut = current_start + self.max_chunk_sec

            valid_cuts = [pt for pt in candidate_cut_points if min_cut <= pt <= max_cut]
            if valid_cuts:
                chosen = min(valid_cuts, key=lambda pt: abs(pt - ideal))
            else:
                chosen = min(ideal, total_duration_sec)

            chunks.append((round(current_start, 3), round(chosen, 3)))
            current_start = chosen

        return chunks

    def process_audio(
        self,
        audio_path: str,
        patient_lang_code: str,
        patient_id: str,
    ) -> dict:
        """
        Executes end-to-end assessment:
        1. Full acoustic normalization and clinical biomarker extraction.
        2. Language routing (scheduled vs. tribal/unsupported).
        3. Speech-aware chunking and transcription across cached ASR models.
        4. Consolidated JSON output assembly.
        """
        timestamp = datetime.now(timezone.utc).isoformat()

        # Step 1: Audio Loading & Ingestion
        try:
            waveform, sr = self.pipeline.normalize_audio(audio_path)
        except Exception as e:
            return {
                "status": "error",
                "patient_id": patient_id,
                "timestamp": timestamp,
                "error_message": f"Could not load or process audio file: {e}",
            }

        # Step 2: Acoustic Analysis on Full Recording (never chunked)
        acoustics = self.pipeline.extract_acoustic_biomarkers(waveform, sr)

        # Handle silent / non-responsive sessions safely
        if not acoustics["speech_detected"]:
            return {
                "status": "no_speech_detected",
                "patient_id": patient_id,
                "timestamp": timestamp,
                "language": (patient_lang_code or "").strip().lower(),
                "acoustic_biomarkers": {
                    "response_latency_sec": acoustics["response_latency_sec"],
                    "pause_count": acoustics["pause_count"],
                    "total_pause_duration_sec": acoustics["total_pause_duration_sec"],
                    "speaking_duration_sec": acoustics["speaking_duration_sec"],
                    "pause_to_speech_ratio": acoustics["pause_to_speech_ratio"],
                },
                "linguistic_data": {
                    "transcript": None,
                    "word_count": None,
                    "transcription_available": False,
                },
            }

        # Step 3: Canonical Language Routing
        routing = self.pipeline.route_language(patient_lang_code)
        lang = routing["language"]
        branch = routing["branch"]

        # Unsupported or tribal dialects bypass ASR gracefully
        if branch != "scheduled":
            return {
                "status": "success",
                "patient_id": patient_id,
                "timestamp": timestamp,
                "language": lang,
                "acoustic_biomarkers": {
                    "response_latency_sec": acoustics["response_latency_sec"],
                    "pause_count": acoustics["pause_count"],
                    "total_pause_duration_sec": acoustics["total_pause_duration_sec"],
                    "speaking_duration_sec": acoustics["speaking_duration_sec"],
                    "pause_to_speech_ratio": acoustics["pause_to_speech_ratio"],
                },
                "linguistic_data": {
                    "transcript": None,
                    "word_count": None,
                    "transcription_available": False,
                },
            }

        # Step 4: Speech-Aware Chunking & Sequential Transcription
        total_duration_sec = waveform.shape[1] / sr
        candidate_cuts = self._find_candidate_cut_points(waveform, sr)
        planned_windows = self._plan_chunks(total_duration_sec, candidate_cuts)

        assembled_chunks: List[str] = []

        with tempfile.TemporaryDirectory(prefix="serenify_prod_chunks_") as tmpdir:
            for idx, (start_sec, end_sec) in enumerate(planned_windows):
                start_sample = int(start_sec * sr)
                end_sample = int(end_sec * sr)
                chunk_wave = waveform[:, start_sample:end_sample]

                chunk_file = os.path.join(tmpdir, f"chunk_{idx:03d}.wav")
                sf.write(
                    chunk_file,
                    chunk_wave.squeeze(0).cpu().numpy(),
                    sr,
                    format="WAV",
                    subtype="PCM_16",
                )

                # pipeline.transcribe handles model caching & CTC -> RNNT fallback
                chunk_text = self.pipeline.transcribe(chunk_file, lang)

                # Filter out [STUB] placeholders and empty outputs
                if chunk_text and not chunk_text.startswith("[STUB]"):
                    cleaned = chunk_text.strip()
                    if cleaned:
                        assembled_chunks.append(cleaned)

        # Step 5: Linguistic Data Assembly
        if assembled_chunks:
            full_transcript = " ".join(assembled_chunks).strip()
            word_count = len(full_transcript.split())
            transcription_available = True
        else:
            full_transcript = None
            word_count = None
            transcription_available = False

        return {
            "status": "success",
            "patient_id": patient_id,
            "timestamp": timestamp,
            "language": lang,
            "acoustic_biomarkers": {
                "response_latency_sec": acoustics["response_latency_sec"],
                "pause_count": acoustics["pause_count"],
                "total_pause_duration_sec": acoustics["total_pause_duration_sec"],
                "speaking_duration_sec": acoustics["speaking_duration_sec"],
                "pause_to_speech_ratio": acoustics["pause_to_speech_ratio"],
            },
            "linguistic_data": {
                "transcript": full_transcript,
                "word_count": word_count,
                "transcription_available": transcription_available,
            },
        }


def main():
    parser = argparse.ArgumentParser(
        description="Run the Serenify audio pipeline and save a clean JSON result."
    )
    parser.add_argument("--audio", required=True, help="Path to the patient's audio recording.")
    parser.add_argument("--patient-id", required=True, help="Patient identifier.")
    parser.add_argument("--language", required=True, help="Language code, e.g. hi or gu.")
    parser.add_argument("--output", default="result.json", help="Where to save the output JSON.")
    parser.add_argument(
        "--verbose", action="store_true",
        help="Show full pipeline/model diagnostic output instead of hiding it.",
    )
    args = parser.parse_args()

    if not os.path.isfile(args.audio):
        print(f"Error: audio file not found: {args.audio}")
        sys.exit(1)

    processor = ProductionChunkedProcessor(target_chunk_sec=15.0)

    if args.verbose:
        result = processor.process_audio(
            audio_path=args.audio,
            patient_lang_code=args.language,
            patient_id=args.patient_id,
        )
    else:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".log") as tmp:
            log_path = tmp.name
        try:
            with suppress_all_output_unless_error(log_path):
                result = processor.process_audio(
                    audio_path=args.audio,
                    patient_lang_code=args.language,
                    patient_id=args.patient_id,
                )
        finally:
            if os.path.exists(log_path):
                os.remove(log_path)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    status = result.get("status", "unknown")
    print(f"✓ Analysis complete (status: {status}) -> {args.output}")


if __name__ == "__main__":
    main()