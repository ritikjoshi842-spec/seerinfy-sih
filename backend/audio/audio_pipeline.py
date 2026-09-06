"""
Serenify Audio Processing Pipeline

Stage 1: Ingestion & Signal Normalization (soundfile + torchaudio)
Stage 2: Acoustic Biomarker Extraction (latency, pauses, speaking duration)
Stage 3: Language-Aware Canonical Routing (Scheduled vs. Tribal)
Stage 4: Speech-to-Text (AI4Bharat IndicConformer via NeMo)
Stage 5: Output Contract Assembly
"""

import os
from datetime import datetime, timezone

import soundfile as sf
import torch
import torchaudio.functional as AF


# Optional NeMo import: agar NeMo present nahi hai ya checkpoint missing hai,
# graceful fallback stub mode mein bina crash hue ho jata hai.
try:
    import nemo.collections.asr as nemo_asr

    NEMO_AVAILABLE = True
except ImportError:
    NEMO_AVAILABLE = False


class AudioAssessmentPipeline:
    # English language names aur common aliases ko ISO codes se map karta hai
    LANGUAGE_NAME_TO_CODE = {
        "assamese": "as",
        "bengali": "bn",
        "bodo": "brx",
        "dogri": "doi",
        "gujarati": "gu",
        "hindi": "hi",
        "kannada": "kn",
        "kashmiri": "ks",
        "konkani": "kok",
        "maithili": "mai",
        "malayalam": "ml",
        "manipuri": "mni",
        "marathi": "mr",
        "nepali": "ne",
        "odia": "or",
        "punjabi": "pa",
        "sanskrit": "sa",
        "santali": "sat",
        "sindhi": "sd",
        "tamil": "ta",
        "telugu": "te",
        "urdu": "ur",

        # Known Tribal / Regional fallbacks
        # (acoustic biomarker branch par route kiye jaate hain)
        "khasi": "kha",
        "garo": "grt",
        "mizo": "lus",
        "kokborok": "trp",
    }

    def __init__(
        self,
        asr_model_path: str = None,
        target_sr: int = 16000,
    ):
        """
        NOTE: asr_model_path is no longer used for loading (kept only so
        existing calls with this argument don't break). Models are now
        downloaded individually per language from AI4Bharat's official
        Hugging Face repos, on first use, via _get_or_load_asr_model().
        """
        self.target_sr = target_sr
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        # IndicConformer dwara supported 22 Scheduled languages
        self.scheduled_languages = {
            "as",
            "bn",
            "brx",
            "doi",
            "gu",
            "hi",
            "kn",
            "ks",
            "kok",
            "mai",
            "ml",
            "mni",
            "mr",
            "ne",
            "or",
            "pa",
            "sa",
            "sat",
            "sd",
            "ta",
            "te",
            "ur",
        }

        # Stage 2 ki audio settings
        self.frame_ms = 25
        self.pause_threshold_ms = 750
        self.onset_debounce_frames = 3

        # ASR Model Container -- ab har language ke liye ek model ka CACHE hai,
        # jo lazily load hota hai (sirf jab woh language actually needed ho), kyunki
        # saare 22 language models ko shuru mein load karna slow hoga aur
        # un languages ke liye bhi kaafi memory use karega jo kisi demo mein shayad kabhi use na hon.
        self.asr_models = {}
        self.asr_enabled = NEMO_AVAILABLE

        if not NEMO_AVAILABLE:
            print("[ASR] nemo_toolkit not available; running in stub mode.")

    def _asr_repo_id(self, lang_code: str) -> str:
        """
        Maps our internal short language code to AI4Bharat's official,
        individually-published Hugging Face model for that language.

        NOTE: repo naming has some inconsistency across AI4Bharat's
        released models (some are named "..._hybrid_rnnt_large", others
        "..._hybrid_ctc_rnnt_large"). This uses the pattern confirmed for
        Hindi -- if a different language's download fails, check its exact
        repo name at https://huggingface.co/ai4bharat and adjust here.
        """
        return f"ai4bharat/indicconformer_stt_{lang_code}_hybrid_rnnt_large"

    def _get_or_load_asr_model(self, lang_code: str):
        """
        Returns a ready-to-use ASR model for this specific language,
        downloading and caching it on first use. Subsequent calls for the
        same language reuse the already-loaded model instead of
        re-downloading or re-initializing it.
        """
        if lang_code in self.asr_models:
            return self.asr_models[lang_code]

        repo_id = self._asr_repo_id(lang_code)
        print(f"[ASR] Loading {repo_id} on {self.device} (first use for '{lang_code}')...")

        model = nemo_asr.models.ASRModel.from_pretrained(repo_id)
        model.freeze()
        model = model.to(self.device)

        self.asr_models[lang_code] = model
        print(f"[ASR] '{lang_code}' model ready.")
        return model

    def normalize_audio(self, audio_path: str):
        """Loads audio and normalizes it using RMS."""

        data, original_sr = sf.read(
            audio_path,
            dtype="float32",
        )

        waveform = torch.from_numpy(data)

        if waveform.ndim == 1:
            waveform = waveform.unsqueeze(0)
        else:
            waveform = waveform.t()

        # Audio ko mono mein downmix karta hai
        if waveform.shape[0] > 1:
            waveform = waveform.mean(
                dim=0,
                keepdim=True,
            )

        # Audio ko target rate (16 kHz) par resample karta hai
        if original_sr != self.target_sr:
            waveform = AF.resample(
                waveform,
                original_sr,
                self.target_sr,
            )

        # Audio volume ko normal level par lao
        rms = torch.sqrt(torch.mean(waveform ** 2))

        if rms > 0:
            target_rms = 0.1

            waveform = waveform * (target_rms / rms)

            waveform = torch.clamp(
                waveform,
                -1.0,
                1.0,
            )

        return waveform, self.target_sr

    def extract_acoustic_biomarkers(
        self,
        waveform: torch.Tensor,
        sr: int,
        frame_ms: float = 25.0,
        baseline_ms: float = 300.0,
        hesitation_threshold_ms: float = 750.0,
        min_speech_frames: int = 3,
    ):
        """Frame-by-frame RMS analysis for latency, speaking duration,
        and pause counts.
        """

        frame_size = int(
            sr * frame_ms / 1000
        )

        num_frames = waveform.shape[1] // frame_size

        if num_frames < min_speech_frames:
            return {
                "response_latency_sec": None,
                "pause_count": 0,
                "total_pause_duration_sec": 0.0,
                "speaking_duration_sec": 0.0,
                "pause_to_speech_ratio": None,
                "speech_detected": False,
            }

        trimmed = waveform[
            :,
            : num_frames * frame_size,
        ]

        frames = trimmed.reshape(
            num_frames,
            frame_size,
        )

        frame_rms = torch.sqrt(
            (frames ** 2).mean(dim=1)
        )

        # Dynamic silence threshold calculate kiya jata hai
        # initial ambient baseline se
        baseline_frame_count = max(
            1,
            int(baseline_ms / frame_ms),
        )

        baseline_frame_count = min(
            baseline_frame_count,
            num_frames,
        )

        baseline_rms = frame_rms[
            :baseline_frame_count
        ].mean()

        threshold = torch.clamp(
            baseline_rms * 3.0,
            min=0.01,
        )

        is_speech = frame_rms > threshold

        # Speech onset ko debounce window ke saath detect karta hai
        onset_frame = None
        consecutive = 0

        for i in range(num_frames):
            if is_speech[i]:
                consecutive += 1

                if consecutive >= min_speech_frames:
                    onset_frame = (
                        i - min_speech_frames + 1
                    )
                    break
            else:
                consecutive = 0

        if onset_frame is None:
            return {
                "response_latency_sec": None,
                "pause_count": 0,
                "total_pause_duration_sec": round(
                    num_frames * frame_size / sr,
                    2,
                ),
                "speaking_duration_sec": 0.0,
                "pause_to_speech_ratio": None,
                "speech_detected": False,
            }

        latency_sec = (
            onset_frame * frame_size / sr
        )

        # Internal hesitation pauses count karta hai (> 750 ms)
        pause_frame_threshold = int(
            round(
                (hesitation_threshold_ms / 1000)
                * sr
                / frame_size
            )
        )

        pause_count = 0
        total_silent_frames = 0
        current_silence_run = 0

        for i in range(onset_frame, num_frames):
            if is_speech[i]:
                if current_silence_run >= pause_frame_threshold:
                    pause_count += 1

                current_silence_run = 0

            else:
                current_silence_run += 1
                total_silent_frames += 1

        total_pause_duration_sec = (
            total_silent_frames * frame_size / sr
        )

        total_audio_sec = (
            num_frames * frame_size / sr
        )

        speaking_duration_sec = max(
            0.0,
            total_audio_sec
            - latency_sec
            - total_pause_duration_sec,
        )

        pause_to_speech_ratio = (
            round(
                total_pause_duration_sec
                / speaking_duration_sec,
                2,
            )
            if speaking_duration_sec > 0
            else None
        )

        return {
            "response_latency_sec": round(
                latency_sec,
                2,
            ),
            "pause_count": pause_count,
            "total_pause_duration_sec": round(
                total_pause_duration_sec,
                2,
            ),
            "speaking_duration_sec": round(
                speaking_duration_sec,
                2,
            ),
            "pause_to_speech_ratio": pause_to_speech_ratio,
            "speech_detected": True,
        }

    def route_language(self, patient_lang_input: str):
        """Resolves aliases to canonical codes and assigns
        scheduled or tribal branch.
        """

        raw = (
            patient_lang_input or ""
        ).strip().lower()

        canonical_code = self.LANGUAGE_NAME_TO_CODE.get(
            raw,
            raw,
        )

        if canonical_code in self.scheduled_languages:
            return {
                "language": canonical_code,
                "branch": "scheduled",
            }

        else:
            return {
                "language": canonical_code,
                "branch": "tribal",
            }

    def transcribe(
        self,
        audio_path: str,
        language_code: str,
    ):
        """
        Runs IndicConformer inference using the correct per-language model,
        following AI4Bharat's officially documented usage pattern.
        Returns "" if a model genuinely produces no text, None if
        transcription could not be attempted at all (e.g. model unavailable
        or a real error occurred), or a [STUB] placeholder if NeMo itself
        isn't installed.
        """

        if not self.asr_enabled:
            return (
                f"[STUB] nemo_toolkit not available. "
                f"language={language_code}"
            )

        try:
            model = self._get_or_load_asr_model(language_code)
        except Exception as e:
            print(
                f"[ASR Warning] Could not load model for language "
                f"'{language_code}': {e}"
            )
            return None

        def _run(decoder_type: str):
            model.cur_decoder = decoder_type

            import inspect
            sig = inspect.signature(model.transcribe)
            extra_kwargs = {}
            if "batch_size" in sig.parameters:
                extra_kwargs["batch_size"] = 1
            if "logprobs" in sig.parameters:
                extra_kwargs["logprobs"] = False
            if "language_id" in sig.parameters:
                extra_kwargs["language_id"] = language_code

            raw_result = model.transcribe([audio_path], **extra_kwargs)

            # Model/decoder ke hisaab se shape alag ho sakti hai: kabhi flat list, kabhi
            # (best_guesses, alternates) tuple -- dono cases ko unwrap karke, phir
            # hamari ek file ka result nikalta hai.
            file_results = raw_result[0] if isinstance(raw_result, tuple) else raw_result
            if not file_results:
                return ""

            result = file_results[0]
            return result.text if hasattr(result, "text") else str(result)

        try:
            # Pehle CTC try hota hai (documented standard default aur faster hai,
            # kyunki yeh step-by-step decode nahi karta) -- lekin humne directly observe kiya hai
            # ki kuch cases mein yeh empty string return kar sakta hai jabki
            # RNNT decoder successfully kaam karta hai, isliye hum automatically fallback karte hain
            # taaki jab text available ho sakta hai tab silently empty result return na ho.
            text = _run("ctc")
            if not text:
                print(
                    f"[ASR] CTC decoder returned empty text for "
                    f"'{language_code}' -- retrying with RNNT decoder."
                )
                text = _run("rnnt")
            return text

        except Exception as e:
            print(
                f"[ASR Warning] Transcription execution failed "
                f"on {audio_path}: {e}"
            )
            return None

    def route_and_transcribe(
        self,
        audio_path: str,
        patient_lang_code: str,
    ):
        """Executes Stage 3 routing and Stage 4 transcription."""

        routing = self.route_language(
            patient_lang_code
        )

        if routing["branch"] == "scheduled":
            transcript = self.transcribe(
                audio_path,
                routing["language"],
            )

            transcription_available = (
                transcript is not None
                and not transcript.startswith("[STUB]")
            )

        else:
            transcript = None
            transcription_available = False

        return {
            "language": routing["language"],
            "branch": routing["branch"],
            "transcript": transcript,
            "transcription_available": transcription_available,
        }

    def process(
        self,
        audio_path: str,
        patient_lang_code: str,
        patient_id: str = None,
        timestamp: str = None,
    ):
        """Master endpoint called by FastAPI/scoring pipeline."""

        if timestamp is None:
            timestamp = datetime.now(
                timezone.utc
            ).isoformat()

        try:
            waveform, sr = self.normalize_audio(
                audio_path
            )

        except Exception as e:
            return {
                "status": "error",
                "patient_id": patient_id,
                "timestamp": timestamp,
                "error_message": (
                    f"Could not load or process audio file: {e}"
                ),
            }

        acoustics = self.extract_acoustic_biomarkers(
            waveform,
            sr,
        )

        if not acoustics["speech_detected"]:
            return {
                "status": "no_speech_detected",
                "patient_id": patient_id,
                "timestamp": timestamp,
                "language": (
                    patient_lang_code or ""
                ).strip().lower(),
                "acoustic_biomarkers": {
                    "response_latency_sec": (
                        acoustics["response_latency_sec"]
                    ),
                    "pause_count": acoustics["pause_count"],
                    "total_pause_duration_sec": (
                        acoustics["total_pause_duration_sec"]
                    ),
                    "speaking_duration_sec": (
                        acoustics["speaking_duration_sec"]
                    ),
                    "pause_to_speech_ratio": (
                        acoustics["pause_to_speech_ratio"]
                    ),
                },
                "linguistic_data": {
                    "transcript": None,
                    "word_count": None,
                    "transcription_available": False,
                },
            }

        routing_result = self.route_and_transcribe(
            audio_path,
            patient_lang_code,
        )

        transcript = routing_result["transcript"]

        word_count = (
            len(transcript.split())
            if transcript is not None
            else None
        )

        return {
            "status": "success",
            "patient_id": patient_id,
            "timestamp": timestamp,
            "language": routing_result["language"],
            "acoustic_biomarkers": {
                "response_latency_sec": (
                    acoustics["response_latency_sec"]
                ),
                "pause_count": acoustics["pause_count"],
                "total_pause_duration_sec": (
                    acoustics["total_pause_duration_sec"]
                ),
                "speaking_duration_sec": (
                    acoustics["speaking_duration_sec"]
                ),
                "pause_to_speech_ratio": (
                    acoustics["pause_to_speech_ratio"]
                ),
            },
            "linguistic_data": {
                "transcript": transcript,
                "word_count": word_count,
                "transcription_available": (
                    routing_result[
                        "transcription_available"
                    ]
                ),
            },
        }


if __name__ == "__main__":
    pipeline = AudioAssessmentPipeline()

    print("\n--- Testing Language Routing & Canonicalization ---")

    tests = [
        "Hindi",
        "assamese",
        "as",
        "bn",
        "Khasi",
        "UNKNOWN_DIALECT",
    ]

    for t in tests:
        route = pipeline.route_language(t)

        print(
            f"Input: {t:16} -> "
            f"Code: {route['language']:6} | "
            f"Branch: {route['branch']}"
        )

    print("\n--- Testing Full End-to-End Processing ---")

    import json

    result_normal = pipeline.process(
        "test_patient_response.wav",
        patient_lang_code="Hindi",
        patient_id="patient_0042",
    )

    print("Case 1 (Standard Voice Sample):")
    print(
        json.dumps(
            result_normal,
            indent=2,
        )
    )

    result_silent = pipeline.process(
        "test_silent.wav",
        patient_lang_code="as",
        patient_id="patient_0042",
    )

    print("\nCase 2 (Silent Sample):")
    print(
        json.dumps(
            result_silent,
            indent=2,
        )
    )