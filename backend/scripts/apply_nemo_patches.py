#!/usr/bin/env python3
"""
apply_nemo_patches.py

Automatically applies the three source-code patches our pipeline needs on
top of a fresh clone of AI4Bharat's NeMo fork. Run this ONCE, right after
cloning NeMo and before running the audio pipeline for the first time.

Usage:
    python apply_nemo_patches.py /path/to/NeMo

If no path is given, assumes a folder named "NeMo" in the current directory.
"""

import sys
from pathlib import Path


def patch_file(path: Path, old: str, new: str, description: str) -> bool:
    """Applies one find-and-replace patch. Returns True if it changed
    something, False if the patch was already applied (safe to re-run)."""
    text = path.read_text(encoding="utf-8")

    if new in text:
        print(f"  [skip] {description} -- already patched.")
        return False

    if old not in text:
        print(f"  [WARNING] {description} -- expected original text not found.")
        print(f"            File may have changed upstream. Skipping -- check manually: {path}")
        return False

    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    print(f"  [OK] {description}")
    return True


def main():
    nemo_root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("NeMo")

    if not nemo_root.is_dir():
        print(f"Error: NeMo folder not found at {nemo_root}")
        print("Clone it first: git clone https://github.com/AI4Bharat/NeMo.git")
        sys.exit(1)

    print(f"Applying patches to {nemo_root.resolve()}\n")

    # --- Patch 1: optional NeptuneLogger import crashes ASR module entirely ---
    patch_file(
        nemo_root / "nemo/utils/exp_manager.py",
        old="from pytorch_lightning.loggers import MLFlowLogger, NeptuneLogger, TensorBoardLogger, WandbLogger",
        new=(
            "from pytorch_lightning.loggers import MLFlowLogger, TensorBoardLogger, WandbLogger\n"
            "NeptuneLogger = None"
        ),
        description="Patch 1/3 -- skip optional NeptuneLogger import",
    )

    # --- Patch 2: np.sctypes removed in NumPy 2.0 ---
    patch_file(
        nemo_root / "nemo/collections/asr/parts/preprocessing/segment.py",
        old=(
            "        if samples.dtype in np.sctypes['int']:\n"
            "            bits = np.iinfo(samples.dtype).bits\n"
            "            float32_samples *= 1.0 / 2 ** (bits - 1)\n"
            "        elif samples.dtype in np.sctypes['float']:\n"
            "            pass"
        ),
        new=(
            "        if np.issubdtype(samples.dtype, np.integer):\n"
            "            bits = np.iinfo(samples.dtype).bits\n"
            "            float32_samples *= 1.0 / 2 ** (bits - 1)\n"
            "        elif np.issubdtype(samples.dtype, np.floating):\n"
            "            pass"
        ),
        description="Patch 2/3 -- NumPy 2.0 compatibility (np.sctypes removed)",
    )

    # --- Patch 3: AggregateTokenizer.ids_to_text() signature mismatch ---
    patch_file(
        nemo_root / "nemo/collections/common/tokenizers/aggregate_tokenizer.py",
        old="    def ids_to_text(self, ids):",
        new="    def ids_to_text(self, ids, lang=None):",
        description="Patch 3/3 -- AggregateTokenizer.ids_to_text() accepts optional lang arg",
    )

    print("\nDone. If any patch shows a WARNING above, check that file manually --")
    print("it likely means AI4Bharat's NeMo fork has changed since these patches were written.")


if __name__ == "__main__":
    main()
