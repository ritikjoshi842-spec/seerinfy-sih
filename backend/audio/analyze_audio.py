#!/usr/bin/env python3
"""
Serenify Audio Pipeline -- Production CLI Wrapper with Speech-Aware Chunked ASR

Yeh Serenify ka main CLI tool hai[cite: 1]. Iska kaam hai:
1. Pure audio ka volume normalize karna aur clinical biomarkers nikalna[cite: 2].
2. Lambi recordings ko ~15-second ke speech-aware tukdo (chunks) mein todkar
   transcribe karna, taaki IndicConformer model fail ya degrade na ho.

Main Features:
1. Biomarkers pure original audio se hi calculate hote hain (chunking se pehle)[cite: 2].
2. Chunks ko natural pauses (halka silence >= 300ms) par kaata jata hai taaki koi shabd beech mein na kate.
3. IndicConformer model ek hi baar load hota hai aur har chunk ke liye reuse hota hai[cite: 2].
4. Output bilkul clean JSON contract deta hai, bina kisi extra debugging info ke[cite: 1, 2].
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

# Agar script kisi aur folder se chalayi jaye, toh bhi audio_pipeline import ho sake
sys.path.insert(0, str(Path(__file__).resolve().parent))
from audio_pipeline import AudioAssessmentPipeline


@contextlib.contextmanager
def suppress_all_output_unless_error(log_path: str):
    """
    Terminal par aane wale faltu background logs, progress bars aur NeMo ke
    technical messages ko chupata hai[cite: 1]. Agar koi error aati hai, tabhi
    saare logs screen par print karta hai debugging ke liye[cite: 1].
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
            print("\n--- Error aa gaya! Diagnostic logs neeche hain: ---\n")
            with open(log_path, "r", encoding="utf-8") as f:
                print(f.read())
            print("--- Diagnostic log khatam ---\n")
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
        Chunking settings set karta hai. Target chunk size lagbhag 15 seconds hai,
        jo experiments mein sabse accurate sabit hua hai.
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
        Audio mein natural gaps ya pauses (>= 300ms) dhoondhta hai taaki audio ko
        wahan se kaata ja sake jahan speaker bolna thoda sa roke.
        (Note: Yeh 300ms sirf cutting ke liye hai, 750ms wale hesitation biomarker se alag hai)[cite: 2].
        """
        frame_size = int(sr * frame_ms / 1000)
        num_frames = waveform.shape[1] // frame_size
        if num_frames < 10:
            return []

        trimmed = waveform[:, : num_frames * frame_size]
        frames = trimmed.reshape(num_frames, frame_size)
        frame_rms = torch.sqrt((frames ** 2).mean(dim=1))

        # Audio ke shuruati shant hisse se baseline silence level tay hota hai
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
                    # Pause ke theek beech wale point ko cutting point banate hain
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
        Target ~15 seconds ko dhyan mein rakh kar chunks decide karta hai.
        Koshish rehti hai ki cut kisi pause par lage, na ki bolte hue shabd ke beech mein.
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

            # Allowed window (10s se 26s ke beech) mein pauses dhoondo
            valid_cuts = [pt for pt in candidate_cut_points if min_cut <= pt <= max_cut]
            if valid_cuts:
                # 15s ke sabse kareeb wala pause select karo
                chosen = min(valid_cuts, key=lambda pt: abs(pt - ideal))
            else:
                # Agar koi pause nahi mila, toh zabardasti target par cut karo
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
        Pura end-to-end processing:
        1. Audio normalize karo aur pure audio ke biomarkers nikalo[cite: 2].
        2. Language check karo (ASR support karti hai ya acoustic-only hai)[cite: 2].
        3. Audio ko 15s ke tukdo mein baanto aur sequential transcribe karo[cite: 2].
        4. Saare tukdo ko jod kar final standard JSON banao[cite: 1, 2].
        """
        timestamp = datetime.now(timezone.utc).isoformat()

        # Step 1: Audio file load aur volume normal level par lao[cite: 2]
        try:
            waveform, sr = self.pipeline.normalize_audio(audio_path)
        except Exception as e:
            return {
                "status": "error",
                "patient_id": patient_id,
                "timestamp": timestamp,
                "error_message": f"Could not load or process audio file: {e}",
            }

        # Step 2: PURE audio se biomarkers calculate karo (chunks mein nahi batna chahiye)[cite: 2]
        acoustics = self.pipeline.extract_acoustic_biomarkers(waveform, sr)

        # Agar recording mein koi aawaz hi nahi aayi toh gracefully handle karo[cite: 2]
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

        # Step 3: Check karo ki language ASR support karti hai ya tribal/unsupported hai[cite: 2]
        routing = self.pipeline.route_language(patient_lang_code)
        lang = routing["language"]
        branch = routing["branch"]

        # Agar tribal ya unsupported dialect hai, toh sirf acoustic biomarkers bhejenge[cite: 2]
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

        # Step 4: Audio ko 15-second ke tukdo mein baanto
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

                # pipeline.transcribe khud model cache sambhalta hai aur fallback handle karta hai[cite: 2]
                chunk_text = self.pipeline.transcribe(chunk_file, lang)

                # Agar NeMo missing hai toh [STUB] aayega, use ignore karo aur sirf real text rakho[cite: 2]
                if chunk_text and not chunk_text.startswith("[STUB]"):
                    cleaned = chunk_text.strip()
                    if cleaned:
                        assembled_chunks.append(cleaned)

        # Step 5: Saare tukdo ka text jodkar ek final transcript aur word count banao
        if assembled_chunks:
            full_transcript = " ".join(assembled_chunks).strip()
            word_count = len(full_transcript.split())
            transcription_available = True
        else:
            full_transcript = None
            word_count = None
            transcription_available = False

        # Final standardized JSON jo team ke backend aur NLP model ke pass jayega[cite: 1, 2]
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
    # CLI arguments setup: bina terminal ko confuse kiye simple flags provide karta hai[cite: 1]
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

    # Verbose mode mein logs screen par aayenge, normal mode mein logs hide rahenge[cite: 1]
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

    # Output ko output file (jaise result.json) mein save karo[cite: 1]
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    status = result.get("status", "unknown")
    print(f"✓ Analysis complete (status: {status}) -> {args.output}")


if __name__ == "__main__":
    main()