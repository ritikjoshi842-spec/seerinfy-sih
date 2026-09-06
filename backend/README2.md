# PROMPT / AGENT TASK LIST — Full Project Audit + AI4Bharat NeMo ASR Setup + Acoustic Biomarker Run

> **How to use this file:** Hand this file to the AI coding agent as its task list for this session. Work through the phases **strictly in order** — do not jump ahead to the NeMo/Hugging Face setup before Phase 1 is fully complete, and do not run the audio pipeline in Phase 6 before Phases 2–5 have all succeeded without errors. If any phase fails, stop, report exactly what failed and why, fix it, and only then move to the next phase.

---

## Phase 0 — Ground Rules Before Starting

- This project (Sereenify) already has a React frontend and a FastAPI backend (`backend/main.py`) built in earlier sessions — the frontend build spec and the Unsplash-integration backend spec (`README.md`) already exist in this repo. Read both before touching anything, so the audit in Phase 1 is informed by what the code is *supposed* to do, not just whether it runs.
- A Hugging Face access token has **already been placed in the `.env` file** by the project owner. Use it from there — do not ask the user for it again, do not print its value to the terminal/logs at any point, and do not commit `.env` to version control.
- Do not skip straight to "it runs" as your definition of done. Each phase below has an explicit success check — confirm it before moving on.

---

## Phase 1 — Full Codebase Audit (Frontend + Backend)

**Goal:** find and fix any mistakes in the existing code before adding anything new on top of it.

1. **Static checks first:**
   - Frontend: run the project's linter/build (`npm run lint` and `npm run build` — or the equivalent scripts in `package.json`) and read every warning and error, not just the ones that block the build.
   - Backend: run a syntax/import sanity pass — `python -m py_compile backend/main.py` (and any other `backend/**/*.py` files that exist so far) — and fix any `ImportError`/`SyntaxError`/`NameError` before doing anything else.

2. **Cross-check the frontend↔backend contract:**
   - Confirm the request/response JSON shapes the frontend actually sends/expects match what `backend/main.py`'s routes actually accept/return (field names, nesting, types). Mismatches here are the single most common source of "it looks fine but nothing works" bugs in this project — check carefully.
   - Confirm `ALLOWED_ORIGINS` in the backend's CORS middleware setup actually includes the port the frontend dev server is really running on right now (check the frontend's dev server startup log for the actual port, don't assume).
   - Confirm every backend route that reads `.env` values (e.g. Unsplash keys) fails with a clear, human-readable error at startup if a variable is missing, rather than crashing confusingly on first request.

3. **Run it end-to-end once, manually:**
   - Start the backend, hit its health-check endpoint, confirm a clean `200`.
   - Start the frontend, walk through the existing flow (profile form → first image → describe → next image) in a browser, and watch both the browser console and the backend terminal for **any** warning, not just hard errors.

4. **Fix everything found.** For each fix: make the smallest change that correctly resolves the issue, note in your final summary (Phase 8) what was wrong and what you changed. Do not refactor or restyle code that isn't actually broken — this audit is about correctness, not taste.

5. **Do not proceed to Phase 2 until:** lint/build is clean, the backend starts without errors, and the manual walkthrough in step 3 completes with no console/server errors.

---

## Phase 2 — Python Environment Setup

1. Create a virtual environment for the backend if one doesn't already exist, and activate it:

   ```bash
   # from the project root
   python3 -m venv .venv

   # macOS/Linux
   source .venv/bin/activate

   # Windows (PowerShell)
   .venv\Scripts\Activate.ps1
   ```

2. Install the backend's own dependencies:

   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Success check:** `pip list` shows `fastapi`, `uvicorn`, `httpx`, `python-dotenv` (and anything else already in `backend/requirements.txt`) with no install errors.

---

## Phase 3 — Clone and Install AI4Bharat NeMo (`nemo-v2` branch)

This is a large, real ASR toolkit (AI4Bharat's fork of NVIDIA NeMo, used to run the IndicConformer speech-to-text models). Do this inside the same activated virtual environment.

1. Clone the repo and check out the correct branch:

   ```bash
   git clone https://github.com/AI4Bharat/NeMo.git
   cd NeMo
   git checkout nemo-v2
   ```

2. Install it in editable mode with the ASR extras:

   ```bash
   pip install -e ".[asr]"
   ```

3. **Prerequisites to verify before/while this runs** (fail loudly and report if any of these aren't met, rather than letting `pip install` fail mysteriously partway through):
   - Python **3.10 or above** (the NeMo `nemo-v2` branch requires this — check with `python --version` before starting the install).
   - Enough free disk space — the toolkit plus its dependencies (PyTorch, etc.) can be several GB; the model checkpoints downloaded in Phase 5 add more on top of that.
   - If `pip install -e ".[asr]"` fails partway through (this branch has a lot of native/audio dependencies like `sox`/`libsndfile`/`ffmpeg` on some systems), check the error for a missing system library before assuming it's a Python packaging problem — install the missing system package and retry rather than modifying `setup.py`/`pyproject.toml`.
   - If editable install still fails after that, the repo's own documented fallback is `bash reinstall.sh` from inside the cloned `NeMo/` folder — try that only if `pip install -e ".[asr]"` genuinely cannot be made to work, and report which path was used.

4. Return to the project root when done (`cd ..`) so the next steps run from the expected working directory.

5. **Success check:** `python -c "import nemo; print(nemo.__version__)"` runs with no import errors from inside the activated venv.

---

## Phase 4 — Apply Project-Specific NeMo Patches

```bash
python backend/scripts/apply_nemo_patches.py
```

- This script contains project-specific patches this codebase needs on top of the stock `AI4Bharat/NeMo` install — run it exactly once, right after the install in Phase 3, before touching Hugging Face or model downloads.
- **Success check:** the script exits with status code 0 and prints/logs whatever confirmation message it's written to print. If it errors, read the traceback fully before attempting a fix — do not re-run it repeatedly against a partially-patched state without understanding why it failed first.

---

## Phase 5 — Hugging Face Authentication (Non-Interactive — Token Already in `.env`)

The project owner has already generated a Hugging Face access token and placed it in `.env` (as `HF_TOKEN=...` — confirm the exact variable name used in the `.env` file and adjust the commands below if it differs). Because this token already exists, **do not run a blind interactive `hf auth login`** — an interactive login expects a human to paste a token or complete a browser flow, which an automated agent session can't do. Instead, feed the existing token in non-interactively:

```bash
# Load the token from .env into the current shell session, then log in with it directly
export HF_TOKEN=$(grep -m1 '^HF_TOKEN=' .env | cut -d '=' -f2-)
hf auth login --token "$HF_TOKEN" --add-to-git-credential
```

- If `hf auth login --token ...` isn't accepted by the installed CLI version, the equivalent, always-available fallback is to simply leave `HF_TOKEN` exported in the environment — both `huggingface_hub` and NeMo's model-download utilities automatically pick up and use the `HF_TOKEN` environment variable for authenticated downloads with no explicit login step required at all. Either path is acceptable; prefer whichever one the installed `huggingface_hub` version actually supports without erroring.
- **Never print `$HF_TOKEN` to the terminal, logs, or any file other than `.env` itself.**
- **Success check:** `hf auth whoami` (or `huggingface-cli whoami`, whichever the installed version exposes) returns the project owner's Hugging Face username, confirming the token is valid and active.

---

## Phase 6 — Preload and Verify the 6 Demo Language Models

```bash
python backend/scripts/preload_models.py
```

- This downloads and caches the ASR models for the 6 demo languages: **Hindi, Gujarati, Assamese, Bodo, Manipuri, and Urdu.**
- This step can take a long time and use significant disk space and bandwidth on first run — this is expected, not a hang. Let it complete; don't kill and restart it unless it's genuinely stalled with no progress for several minutes.
- Some of these languages are lower-resource than others. If the script logs that a checkpoint isn't available on the Hub for one specific language, that is useful diagnostic output, not necessarily a bug in the script — report it as-is in your Phase 8 summary rather than treating it as something to silently work around.
- **Success check:** the script reports all 6 languages processed (each either successfully cached, or explicitly logged as unavailable — not silently skipped or crashed on).

---

## Phase 7 — Run the Acoustic Biomarker Pipeline

```bash
python backend/audio/analyze_audio.py \
  --audio patient_recording.wav \
  --patient-id patient_0042 \
  --language Hindi \
  --output result.json
```

- Confirm `patient_recording.wav` actually exists at the path this command expects before running it; if it's a placeholder/sample file that needs to be added first, say so rather than fabricating a fake audio file just to make the command "succeed."
- Expected behavior: the pipeline processes the audio, extracts acoustic biomarkers, and — **only if an ASR model is available for Hindi from Phase 6** — also generates a transcript. Both the biomarkers and (if present) the transcript should end up in `result.json`.
- **Success check:** `result.json` is created, is valid JSON, and contains the acoustic biomarker fields at minimum. If a transcript field is present, spot-check that it's non-empty and plausibly Hindi text (not an empty string or an error message swallowed into the field).

---

## Phase 8 — Final Full Project Verification

Once Phase 7 succeeds, do one more complete pass to confirm nothing regressed:

1. Re-run the frontend↔backend manual walkthrough from Phase 1, step 3, one more time — confirm it still works after everything installed in Phases 2–6 (a fresh `pip install -e .` elsewhere can occasionally shadow or conflict with existing packages — catch that here if it happened).
2. Re-run `python backend/audio/analyze_audio.py` once more (same command as Phase 7) to confirm the result is reproducible, not a one-off fluke.
3. Produce a short summary covering:
   - What was found and fixed in Phase 1 (if anything).
   - Confirmation that each phase's success check (Phases 2–7) passed.
   - The final contents (or a summary of the fields) of the generated `result.json`.
   - Any warnings that were non-fatal but worth the project owner knowing about (e.g. a language with no available ASR checkpoint).

Do not report the task as complete until all three items above are done and clean.


Somtimes, the hugging face models requires us to manually except thier terms and conditions. so also tell me what models are being used and what their terms and conditions are. also check if i need to accept the terms and conditions before running the code.