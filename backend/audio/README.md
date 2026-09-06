# Serenify Audio Assessment Pipeline

The audio processing and biomarker extraction subsystem for **Serenify** (Smart India Hackathon).

This module handles:
- Audio ingestion
- RMS loudness normalization
- Dynamic clinical biomarker calculation
- Dialect routing
- Native Indic transcription using AI4Bharat IndicConformer models

Teammates working on downstream NLP, scoring, or frontend tasks can execute a single CLI command (`analyze_audio.py`) to generate a clean `result.json` without needing to interact with PyTorch or NeMo internals.

---

## 1. System Requirements & Platform Support

| Requirement       | Details                                                                 |
|-------------------|-------------------------------------------------------------------------|
| **Operating System** | Linux (tested on Arch Linux / Ubuntu 22.04+)                           |
| **Windows**       | Use **WSL2** (Ubuntu 22.04+) with host NVIDIA GPU acceleration. Native Windows PowerShell/CMD will fail during NeMo installation. |
| **Python**        | 3.12                                                                    |
| **Compute**       | CUDA-capable NVIDIA GPU recommended (automatic CPU fallback)            |
| **Hugging Face**  | Account required to accept gated access terms for IndicConformer models |

### Stub Fallback Mode
If NeMo is unavailable, the pipeline falls back to **stub mode** (`NEMO_AVAILABLE = False`). Acoustic biomarkers are still computed normally. CPU execution is supported, while a CUDA-capable NVIDIA GPU is recommended for better ASR performance.

---

## 2. Environment Setup

Run all commands from the repository root (or inside your WSL2 environment):

```bash
# 1. Create and activate a Python 3.12 virtual environment
python3.12 -m venv venv312
source venv312/bin/activate

# 2. Install base dependencies
pip install --upgrade pip
pip install -r backend/requirements.txt
```

---

## 3. NeMo Setup & Automated Patching

AI4Bharat's IndicConformer models require their specific NeMo fork. Modern dependency versions introduce deprecations, so three automated source patches must be applied:

```bash
# 1. Clone AI4Bharat's NeMo fork
git clone https://github.com/AI4Bharat/NeMo.git
cd NeMo
git checkout nemo-v2

# 2. Install in editable mode
pip install -e ".[asr]"
cd ..

# 3. Apply compatibility patches (NumPy 2.0, NeptuneLogger, AggregateTokenizer)
python backend/scripts/apply_nemo_patches.py NeMo
```

---

## 4. Model Pre-Warming (Offline Execution)

IndicConformer models are license-gated. Before running evaluations, visit each link on Hugging Face and click **"Agree and access repository"**:

- [Hindi (`hi`)](https://huggingface.co/ai4bharat/indicconformer_stt_hi_hybrid_rnnt_large)
- [Gujarati (`gu`)](https://huggingface.co/ai4bharat/indicconformer_stt_gu_hybrid_rnnt_large)
- [Assamese (`as`)](https://huggingface.co/ai4bharat/indicconformer_stt_as_hybrid_rnnt_large)
- [Bodo (`brx`)](https://huggingface.co/ai4bharat/indicconformer_stt_brx_hybrid_rnnt_large)
- [Manipuri (`mni`)](https://huggingface.co/ai4bharat/indicconformer_stt_mni_hybrid_rnnt_large)
- [Urdu (`ur`)](https://huggingface.co/ai4bharat/indicconformer_stt_ur_hybrid_rnnt_large)

Log into your Hugging Face account via the terminal:

```bash
hf auth login
```

Preload and verify the 6 demo checkpoints:

```bash
python backend/scripts/preload_models.py
```

The models will download into your local Hugging Face cache (`~/.cache/huggingface/hub/`). Once cached, subsequent runs can reuse the local model files without downloading them again unless the cache is removed.

---

## 5. Running the Pipeline (Handoff Command)

Teammates should use `analyze_audio.py`. It suppresses diagnostic logs, progress bars, and model loading noise, outputting a clean JSON artifact:

```bash
python backend/audio/analyze_audio.py \
  --audio tests/audio/test_patient_response.wav \
  --patient-id patient_001 \
  --language hi \
  --output result.json
```

### Optional Flags
- `--verbose` — Shows internal NeMo decoding logs, model initialization details, and device placement.
- `--output` — Customizes where the JSON result is saved (defaults to `result.json`).

---

## 6. Standard JSON Contract (`result.json`)

The script outputs a standardized JSON contract ready for ingestion by NLP, scoring, or longitudinal modules:

```json
{
  "status": "success",
  "patient_id": "patient_001",
  "timestamp": "2026-09-05T09:49:19.284671+00:00",
  "language": "hi",
  "acoustic_biomarkers": {
    "response_latency_sec": 0.7,
    "pause_count": 3,
    "total_pause_duration_sec": 11.5,
    "speaking_duration_sec": 9.62,
    "pause_to_speech_ratio": 1.19
  },
  "linguistic_data": {
    "transcript": "हेलो हेलो आप कैसे हो मैं अभी दिल्ली में हूँ",
    "word_count": 10,
    "transcription_available": true
  }
}
```

### Defensive Edge-Case Behavior
- **Silent / Non-Responsive Recording**: Emits `"status": "no_speech_detected"` with safe `null` biomarkers to prevent downstream division-by-zero crashes.
- **Tribal / Low-Resource Dialects** (e.g., Khasi, Garo): Automatically skips speech-to-text (`"transcription_available": false`, `"transcript": null`) while retaining complete acoustic biomarker timing calculations.

---

## 7. Downstream Consumption Example (NLP / ML Integration)

Your downstream scripts can read `result.json` directly:

```python
import json

with open("result.json", "r", encoding="utf-8") as f:
    session_data = json.load(f)

# Machine Learning / Longitudinal Analytics
latency = session_data["acoustic_biomarkers"]["response_latency_sec"]
pauses = session_data["acoustic_biomarkers"]["pause_count"]

# NLP / Semantic Scoring Pipeline
if session_data["linguistic_data"]["transcription_available"]:
    transcript = session_data["linguistic_data"]["transcript"]
    # Pass transcript to LangChain / semantic analysis
```

---

## Notes for Contributors

- Always run from a properly activated Python 3.12 virtual environment.
- Prefer GPU for real-time performance; CPU fallback is fully supported.
- Models are cached after the first download — subsequent runs are fully offline.
- For any NeMo-related issues, re-run the patching script after updating the NeMo checkout.
