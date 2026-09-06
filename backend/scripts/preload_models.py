"""
Serenify demo ke liye IndicConformer ASR models ko pehle se download karo.

Is script mein koi ASR model-loading logic nahi hai.
Yeh AudioAssessmentPipeline ke existing model-loading method ko use karta hai
taaki pipeline hi single source of truth rahe.

Models Hugging Face dwara local machine pe cache ho jaate hain.

Demo languages:
    hi  - Hindi
    gu  - Gujarati
    as  - Assamese
    brx - Bodo
    mni - Manipuri
    ur  - Urdu

Backend directory se run karo:

    python scripts/preload_models.py
"""

import sys
from pathlib import Path

import torch


# Is script ko ../audio/ se audio_pipeline.py import karne do.
# Agar final folder structure alag hai to isko adjust karo.
BACKEND_DIR = Path(__file__).resolve().parent.parent
AUDIO_DIR = BACKEND_DIR / "audio"

sys.path.insert(0, str(AUDIO_DIR))

from audio_pipeline import AudioAssessmentPipeline


# Ye woh chhe languages hain jo abhi demo ke liye select kiye gaye hain.
DEMO_LANGUAGES = [
    "hi",   # Hindi
    "gu",   # Gujarati
    "as",   # Assamese
    "brx",  # Bodo
    "mni",  # Manipuri
    "ur",   # Urdu
]


def main():
    print("=" * 60)
    print("Serenify - Preloading IndicConformer ASR Models")
    print("=" * 60)

    print("\nCreating AudioAssessmentPipeline...")
    pipeline = AudioAssessmentPipeline()

    if not pipeline.asr_enabled:
        print("\nERROR: NeMo ASR is not available.")
        print("Make sure the AI4Bharat NeMo fork is installed and patched.")
        sys.exit(1)

    print(f"\nDevice: {pipeline.device}")
    print(f"Languages to preload: {', '.join(DEMO_LANGUAGES)}")

    successful = []
    failed = []

    for language in DEMO_LANGUAGES:
        repo_id = pipeline._asr_repo_id(language)

        print("\n" + "-" * 60)
        print(f"Language : {language}")
        print(f"Model    : {repo_id}")
        print("-" * 60)

        try:
            model = pipeline._get_or_load_asr_model(language)

            # GPU memory se model ko hatao taaki VRAM khatam na ho
            # lekin weights ~/.cache/huggingface/hub/ mein intact rahein
            del model
            if language in pipeline.asr_models:
                del pipeline.asr_models[language]
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

            successful.append(language)
            print(f"SUCCESS: {language} model cached to disk and verified.")

        except Exception as e:
            failed.append((language, str(e)))

            print(f"FAILED: Could not load {language} model.")
            print(f"Reason: {e}")

    print("\n" + "=" * 60)
    print("Preload Summary")
    print("=" * 60)

    print(f"\nSuccessful: {len(successful)}/{len(DEMO_LANGUAGES)}")

    if successful:
        print("Ready:")
        for language in successful:
            print(f"  ✓ {language}")

    if failed:
        print("\nFailed:")
        for language, error in failed:
            print(f"  ✗ {language}: {error}")

    if failed:
        print("\nSome models could not be loaded.")
        print("Check your Hugging Face authentication and model access.")
        sys.exit(1)

    print("\nAll demo models are ready.")
    print("They are now cached locally and will not need to be")
    print("downloaded again unless the local cache is removed.")


if __name__ == "__main__":
    main()
