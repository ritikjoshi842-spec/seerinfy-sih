"""
Serenify Audio Pipeline -- Clean CLI Wrapper

This wrapper exists so a teammate can run the audio pipeline and get a
clean result.json, WITHOUT needing to see (or understand) the model-
loading logs, NeMo diagnostics, or any of the environment debugging that
went into building the pipeline itself.

It does NOT change any pipeline logic -- audio_pipeline.py remains the
single source of truth. This file only controls how its output is
presented.

Normal use (quiet):
    python analyze.py --audio recording.wav --patient-id P001 --language hi

If something goes wrong, or you want to see what's happening under the
hood (e.g. to debug model loading):
    python analyze.py --audio recording.wav --patient-id P001 --language hi --verbose
"""

import argparse
import contextlib
import json
import os
import sys
import tempfile

from audio_pipeline import AudioAssessmentPipeline


@contextlib.contextmanager
def suppress_all_output_unless_error(log_path: str):
    """
    Redirects BOTH stdout and stderr at the operating-system file-
    descriptor level (not just Python's print()) to a temporary log file.

    This is more thorough than contextlib.redirect_stdout/stderr alone --
    it also catches output from NeMo's internal logging, tqdm progress
    bars, and anything else that writes directly to the terminal rather
    than through Python's own print() -- exactly the gap flagged as a risk
    if we'd only used the simpler approach.

    If an exception occurs inside the `with` block, the captured log is
    printed automatically before the exception propagates, so a teammate
    isn't left with a bare crash and no way to see what actually happened
    without knowing to rerun with --verbose.
    """
    stdout_fd = sys.stdout.fileno()
    stderr_fd = sys.stderr.fileno()
    saved_stdout_fd = os.dup(stdout_fd)
    saved_stderr_fd = os.dup(stderr_fd)

    with open(log_path, "w") as log_file:
        os.dup2(log_file.fileno(), stdout_fd)
        os.dup2(log_file.fileno(), stderr_fd)
        try:
            yield
        except Exception:
            # Restore real output FIRST, so the printed log is actually visible
            os.dup2(saved_stdout_fd, stdout_fd)
            os.dup2(saved_stderr_fd, stderr_fd)
            print("\n--- An error occurred. Captured diagnostic log: ---\n")
            with open(log_path) as f:
                print(f.read())
            print("--- End of diagnostic log ---\n")
            raise
        finally:
            os.dup2(saved_stdout_fd, stdout_fd)
            os.dup2(saved_stderr_fd, stderr_fd)
            os.close(saved_stdout_fd)
            os.close(saved_stderr_fd)


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

    if args.verbose:
        pipeline = AudioAssessmentPipeline()
        result = pipeline.process(args.audio, args.language, patient_id=args.patient_id)
    else:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".log") as tmp:
            log_path = tmp.name
        try:
            with suppress_all_output_unless_error(log_path):
                # Construction AND process() both need to be inside the
                # suppressed block -- the pipeline can print diagnostic
                # messages (e.g. "ASR not available") during construction
                # too, not just during process().
                pipeline = AudioAssessmentPipeline()
                result = pipeline.process(args.audio, args.language, patient_id=args.patient_id)
        finally:
            if os.path.exists(log_path):
                os.remove(log_path)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    status = result.get("status", "unknown")
    print(f"[OK] Analysis complete (status: {status}) -> {args.output}")


if __name__ == "__main__":
    main()
