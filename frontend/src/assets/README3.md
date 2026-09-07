# PROMPT / AGENT TASK LIST — Patient-Description Scoring System (Qdrant Semantic Matching, No LLM, Deployment-Safe)

> **How to use this file:** Hand this to the AI coding agent working on the `langchain-ai` branch (the Qdrant-based embedding system). Work through the phases in order. **Phase 0 (models list) and Phase 6 (deployment-safety audit) are not optional reading** — they exist specifically so nothing heavy gets installed by accident partway through the other phases.

---

## Phase 0 — Every Model/Library This Build Uses (read this before installing anything)

This is the full, explicit list requested up front so there is zero ambiguity about what's being added to the project. **Nothing outside this list should be installed for the scoring system.**

| # | Name | What it's used for | Why this one, not something heavier | Approx. footprint |
|---|---|---|---|---|
| 1 | **NLTK**, specifically the `punkt`, `punkt_tab`, and `averaged_perceptron_tagger_eng` data packages | Tokenizing the patient's description and tagging each word's part of speech (noun/verb/adjective/number/etc.) — this is what powers keyword/phrase extraction in Phase 2 and the word-weighting in Phase 4 | Chosen over spaCy: NLTK's tokenizer + POS tagger needs no large model download, no compiled `en_core_web_*` pipeline, and installs in a few MB. It is not a neural network, so it adds no RAM pressure at inference time. | ~5–10 MB (data packages only; the library itself is pure Python) |
| 2 | **rapidfuzz** | Fuzzy matching of filler-word variants (`umm`, `ummm`, `uhhh`, `hmmm`, …) in Phase 3 | It's a small, compiled string-similarity library with no model weights at all — just an algorithm. This is the correct tool for "fuzzy match against a short known list," and there is nothing lighter that still does fuzzy matching properly. | ~2–3 MB |
| 3 | **fastembed**, using the model `BAAI/bge-small-en-v1.5` (its default **quantized** ONNX build) | The **only** neural/embedding model in this entire build — used exclusively in Phase 5 to compute cosine similarity between each patient keyword and the portfolio word | This is the one deliberate substitution from what you'd normally reach for. `sentence-transformers` (the library named in your instructions as an example) pulls in **PyTorch**, which alone is typically 300 MB–1 GB+ installed and pushes cold-start RAM well past what a free-tier host can spare. `fastembed` (built by Qdrant, the same vendor already in this project) runs the same class of embedding model through **ONNX Runtime instead of PyTorch**, cutting the footprint by roughly 5–10×. It is still, architecturally, "a SentenceTransformer-family model + cosine similarity" — exactly what was asked for — just running on a lighter engine. | ~50–130 MB (quantized model weights + onnxruntime, no PyTorch) |
| 4 | **Qdrant client** | Unchanged — still used exactly as it already is in the existing `langchain-ai` branch for the portfolio-word embeddings/collection | No change requested or made here | (already in project) |

**Explicitly NOT used anywhere in this build**, so the agent doesn't second-guess this later: no LLM of any kind (no OpenAI/Anthropic/local-model calls), no image-captioning or vision model, no spaCy, no vanilla `sentence-transformers` + PyTorch, no scikit-learn (cosine similarity is computed by hand with plain NumPy — one extra heavy dependency avoided for one dot-product formula).

If, after building this, real measured memory usage still doesn't fit your target host's free tier, **stop and report it** rather than silently swapping in a smaller model that hasn't been vetted here — see Phase 6 for exactly how to check this and what the honest next step is.

---

## Phase 1 — Audit the Existing `langchain-ai` Branch First

Before writing a single new line for the scoring system:

1. Read through the current Qdrant-based embedding system end to end — understand how a "portfolio word" currently gets turned into an embedding, how the patient's description currently gets compared to it, and where that comparison result currently flows into the API response.
2. Check for and fix any existing errors — run the backend, exercise its existing endpoints, and read every traceback/warning, not just ones that outright crash it.
3. Specifically confirm CORS is configured correctly for local testing (explicit origin list for the frontend's actual dev-server port, `allow_credentials`/`allow_origins` not mismatched — same rules as in this project's existing FastAPI CORS setup). If CORS is missing or misconfigured on this branch, fix it now, before adding new endpoints on top of a broken base.
4. Do not proceed to Phase 2 until the branch runs cleanly and the existing (pre-scoring-system) behavior works end to end.

---

## Phase 2 — Installing Dependencies (do this manually, not from `requirements.txt`)

**Do not run a blind `pip install -r requirements.txt` pass and do not bulk-install everything from Phase 0's table at once.** Instead:

1. First, actually **read** the project's existing dependency file and source code to understand what's already installed and what each existing dependency is for. Don't add a second copy of something that's functionally already there.
2. This project uses **`uv`** as its package manager. Add each *new* dependency **one at a time**, checking that the install succeeds and the import works before moving to the next:

   ```bash
   uv add nltk
   uv add rapidfuzz
   uv add fastembed
   ```

   (If the project doesn't yet have a `uv`-managed `pyproject.toml`, run `uv init --no-readme` first, without overwriting any existing source files, then proceed with the `uv add` calls above.)

3. NLTK also needs its data packages downloaded once (this is data, not a pip package — do this as a one-time setup step, ideally triggered at app startup if the data isn't already cached, so it's not a manual step someone forgets on a fresh deploy):

   ```python
   import nltk
   for pkg in ("punkt", "punkt_tab", "averaged_perceptron_tagger_eng"):
       nltk.download(pkg, quiet=True)
   ```

4. **Success check for this phase:** `python -c "import nltk, rapidfuzz, fastembed"` runs with no import errors, and `uv.lock`/`pyproject.toml` now lists exactly these three new entries — nothing extra pulled in unexpectedly (check the lockfile diff; if `torch` shows up anywhere in it, something pulled it in transitively — stop and report which package did that before continuing).

---

## Phase 3 — Keyword/Key-Phrase Extraction & Lexical Density Score

**Goal:** for a given patient description, return `keywords / total_words` as a percentage, favoring recall over precision.

Approach (POS-tag based, not a neural model — this is deliberately simple and fast):

```python
import re
import nltk
from nltk import word_tokenize, pos_tag

# Parts of speech we KEEP (high recall — objects/people, actions, locations,
# colors/shapes/sizes/quantities, descriptive detail). Everything else
# (determiners, prepositions, conjunctions, pronouns, auxiliary "be"/"have") is dropped.
KEEP_POS_PREFIXES = ("NN", "VB", "JJ", "RB", "CD")  # nouns, verbs, adjectives, adverbs, numbers

# A short, conservative stopword list for cases POS-tagging alone won't catch
# (grammatical words that still get tagged as content words in casual speech).
GRAMMATICAL_FILLER = {"is", "was", "are", "were", "be", "been", "am", "the", "a", "an"}

def extract_keywords(description: str) -> list[str]:
    tokens = word_tokenize(description)
    tagged = pos_tag(tokens)
    keywords = [
        word for word, tag in tagged
        if tag.startswith(KEEP_POS_PREFIXES)
        and word.lower() not in GRAMMATICAL_FILLER
        and word.isalpha()
    ]
    return keywords

def lexical_density_score(description: str) -> dict:
    tokens = [t for t in word_tokenize(description) if t.isalpha()]
    total_words = len(tokens) or 1  # avoid divide-by-zero on empty input
    keywords = extract_keywords(description)
    ratio = len(keywords) / total_words
    return {
        "keywords": keywords,
        "total_words": total_words,
        "keyword_count": len(keywords),
        "lexical_density_pct": round(ratio * 100, 1),
    }
```

- This intentionally **over-includes** rather than under-includes, per the requirement — do not add additional aggressive filtering (no removing words just because they seem "generic"; that judgment happens later, in Phase 5's weighting, not here).
- `lexical_density_pct` is the number reported in **Pie Chart 1** (Phase 7).

---

## Phase 4 — Filler-Word Detection

**Goal:** robustly detect filler words (`um`, `umm`, `ummm`, `uh`, `uhh`, `uhhhh`, `hmm`, etc.) including repeated-character variants, without exact-string-matching brittleness, and **without** over-flagging context-dependent words like `like`, `so`, `well`.

```python
import re
from rapidfuzz import fuzz

CANONICAL_FILLERS = ["um", "uh", "hmm", "erm", "ah", "huh"]

# Context-dependent words: only ever treated as fillers under a narrow,
# explicit condition below — never blanket-classified.
CONTEXT_DEPENDENT = {"like", "so", "well"}

def normalize_repeated_chars(word: str) -> str:
    """'ummmm' -> 'umm', 'uhhhh' -> 'uhh' — collapse runs of 3+ identical
    characters down to 2, so fuzzy matching isn't thrown off by however
    long the speech-to-text transcript stretched the sound out."""
    return re.sub(r"(.)\1{2,}", r"\1\1", word.lower())

def is_filler(word: str, prev_word: str | None, next_word: str | None, fuzzy_threshold: int = 80) -> bool:
    normalized = normalize_repeated_chars(word)

    if normalized in CONTEXT_DEPENDENT:
        # Only flag these as fillers when they appear isolated — not
        # immediately preceded/followed by a word that would make them
        # part of a real clause (e.g. "looks like", "so I", "as well").
        # This is a conservative rule on purpose: when unsure, do NOT flag it.
        isolated = prev_word is None or next_word is None or (
            prev_word in {",", None} and next_word in {",", ".", None}
        )
        return isolated

    if normalized in CANONICAL_FILLERS:
        return True

    # Fuzzy fallback for variants not caught by normalization alone
    # (e.g. keyboard/ASR quirks like "uhm", "hmmmm" with an odd letter).
    return any(fuzz.ratio(normalized, canon) >= fuzzy_threshold for canon in CANONICAL_FILLERS)

def filler_word_score(description: str) -> dict:
    words = description.split()
    total_words = len(words) or 1
    filler_count = 0
    for i, w in enumerate(words):
        prev_w = words[i - 1] if i > 0 else None
        next_w = words[i + 1] if i < len(words) - 1 else None
        if is_filler(w.strip(".,!?"), prev_w, next_w):
            filler_count += 1
    return {
        "filler_count": filler_count,
        "total_words": total_words,
        "filler_word_pct": round((filler_count / total_words) * 100, 1),
    }
```

- `filler_word_pct` is the number reported in **Pie Chart 2** (Phase 7).
- Integrate this into the existing scoring flow **without breaking current functionality** — add it as a new field alongside whatever the endpoint already returns, don't replace or restructure the existing response shape.

---

## Phase 5 — Semantic Relevance to the Portfolio Word (Qdrant + Embeddings, No LLM)

**Problem being fixed:** the current system compares patient keywords directly (string match) against the single portfolio word used to generate the image, which unfairly tanks the score whenever the patient uses a natural-but-different word for the same idea.

**Fix — weighted cosine similarity instead of exact match:**

```python
import numpy as np
from fastembed import TextEmbedding

_embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

# How much each POS category counts toward the final weighted score.
# Configurable on purpose — tune these without touching the scoring logic.
POS_WEIGHTS = {
    "NN": 1.0, "NNS": 1.0, "NNP": 1.0, "NNPS": 1.0,   # nouns / proper nouns -> objects, people, places
    "JJ": 0.9, "JJR": 0.9, "JJS": 0.9,                 # adjectives -> descriptive detail
    "CD": 0.8,                                          # numbers/quantities
    "VB": 0.5, "VBD": 0.5, "VBG": 0.5, "VBN": 0.5, "VBP": 0.5, "VBZ": 0.5,  # verbs/actions
    "RB": 0.4, "RBR": 0.4, "RBS": 0.4,                 # adverbs
}
DEFAULT_WEIGHT = 0.3  # anything else that survived Phase 3's filter

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def weighted_semantic_relevance(tagged_keywords: list[tuple[str, str]], portfolio_word: str) -> dict:
    """tagged_keywords: list of (word, pos_tag) — reuse the output of
    nltk.pos_tag from Phase 3 so the description is only tokenized once."""
    if not tagged_keywords:
        return {"weighted_relevance_pct": 0.0, "per_keyword": []}

    portfolio_vec = np.array(list(_embedding_model.embed([portfolio_word]))[0])
    words_only = [w for w, _ in tagged_keywords]
    keyword_vecs = list(_embedding_model.embed(words_only))

    weighted_sum = 0.0
    weight_total = 0.0
    per_keyword = []
    for (word, tag), vec in zip(tagged_keywords, keyword_vecs):
        sim = cosine_similarity(np.array(vec), portfolio_vec)
        weight = POS_WEIGHTS.get(tag, DEFAULT_WEIGHT)
        weighted_sum += sim * weight
        weight_total += weight
        per_keyword.append({"word": word, "similarity": round(sim, 3), "weight": weight})

    relevance = weighted_sum / weight_total if weight_total else 0.0
    return {
        "weighted_relevance_pct": round(relevance * 100, 1),
        "per_keyword": per_keyword,
    }
```

- No strict matched/not-matched threshold anywhere — the raw similarity scores drive the weighted average directly, exactly as required.
- `portfolio_word` here is whatever single word the existing system already uses to generate the Unsplash image for the current category (hobby/past-activity/favorite-place/milestone) — locate that value in the existing code (Phase 1's read-through) and pass it straight into this function; don't change how it's chosen.

---

## Phase 6 — Combined Final Score

```python
# Configurable weights — change these two numbers only if the weighting
# itself needs to change; nothing else in this function should need editing.
COMPLETENESS_WEIGHT = 0.4
SEMANTIC_WEIGHT = 0.6

def final_score(lexical_density_pct: float, weighted_relevance_pct: float) -> float:
    """'Completeness' reuses the Phase-3 lexical density ratio directly —
    it is the same 'meaningful keywords relative to the whole description'
    measure requested, not a second separate metric, per the instruction
    to make the minimum necessary changes."""
    completeness = lexical_density_pct / 100
    semantic_relevance = weighted_relevance_pct / 100
    combined = (COMPLETENESS_WEIGHT * completeness) + (SEMANTIC_WEIGHT * semantic_relevance)
    return round(combined * 100, 1)
```

Wire Phases 3–6 together into a single function the existing "analyze description" endpoint calls, returning one JSON object with all four numbers (`lexical_density_pct`, `filler_word_pct`, `weighted_relevance_pct`, `final_score_pct`) — extend the existing analyze/scoring response shape with these fields rather than replacing it, per the "preserve existing architecture" requirement.

---

## Phase 7 — Frontend: Replace the Static Pie Charts With Real Ones

1. Locate the existing static/mock pie-chart component(s) currently showing placeholder scores in the frontend (wherever the analysis results are displayed after a patient submits a description). Remove the hardcoded data feeding them.
2. Replace with **three** real pie charts, each fed by the live numbers from Phase 6's response:
   - **Chart 1 — Lexical Density:** `lexical_density_pct` (keywords) vs. `100 − lexical_density_pct` (everything else).
   - **Chart 2 — Filler Word Ratio:** `filler_word_pct` (filler) vs. `100 − filler_word_pct` (clean speech).
   - **Chart 3 — Final Score Composition:** three slices — `COMPLETENESS_WEIGHT × lexical_density_pct` (completeness's contribution), `SEMANTIC_WEIGHT × weighted_relevance_pct` (semantic relevance's contribution), and `100 − final_score_pct` (the remainder, so the chart always sums to 100%).
   - (If a different 3-chart breakdown was actually intended, this is the explicit, unambiguous version being built — flag it back if it doesn't match what was pictured, rather than guessing differently later.)
3. Use the charting library already in this project's frontend dependencies (`recharts`'s `PieChart`/`Pie` components) rather than adding a new charting library for this.
4. These charts render from the actual API response object — no mock data, no hardcoded percentages, anywhere in this component going forward.

---

## Phase 8 — Final Audit (do this last, after everything above works)

1. **Dependency audit:** confirm every import anywhere in the touched files has a corresponding entry in `pyproject.toml`/`uv.lock` — no import that "happens to work" because it was already transitively installed by something else. Also confirm nothing from Phase 0's "explicitly not used" list snuck in as a transitive dependency (check specifically for `torch`, `spacy`, `scikit-learn` in the lockfile).
2. **CORS/middleware re-check:** re-confirm the audit fixes from Phase 1 are still intact after all the new endpoints/fields were added — a new route file or router split can sometimes bypass middleware applied elsewhere; verify the new/extended analyze endpoint still returns proper CORS headers when called from the frontend's actual origin.
3. **End-to-end walkthrough:** submit a real description through the actual frontend flow and confirm all three pie charts render with real, non-zero, sensible numbers (not `NaN`, not stuck at a mock value).

---

## Phase 9 — Deployment Safety (Vercel / Render Free Tiers) — Read Before Deploying

This section exists because a heavy model here would break exactly the kind of free-tier deploy this project is targeting, so it's spelled out with real numbers rather than left as a vague warning:

- **Vercel Python Serverless Functions:** the platform's own current limit is **500 MB uncompressed** per function bundle (recently raised from 250 MB), and functions still pay a cold-start cost every time they spin up from idle — loading an embedding model on every cold start is slow and RAM-hungry compared to a persistent process. Vercel is a fine place for the **React frontend**, but is a fragile choice for a Python backend that loads an embedding model, even a small one.
- **Render's free tier:** a persistent container (not a per-invocation function), but capped at **512 MB RAM and 0.1 CPU**, with the service spinning down after 15 minutes idle and taking ~30–60 seconds to wake up. This is the more realistic free-tier home for this FastAPI+Qdrant+fastembed backend, but 512 MB is genuinely tight once FastAPI, the Qdrant client, `onnxruntime`, NumPy, and the loaded model are all resident at once.
- **What this build already does about it:** using `fastembed`'s quantized `BAAI/bge-small-en-v1.5` instead of `sentence-transformers`+PyTorch is the single biggest lever available here (it removes the single largest dependency, PyTorch, entirely) — this is already the lightest realistic option for genuine sentence-embedding cosine similarity without an LLM.
- **Being straightforward about the actual risk:** even with this quantized model, whether it comfortably fits in Render's 512 MB alongside everything else can only be confirmed by actually measuring RSS memory on a staging deploy — do that before assuming it's fine. If it turns out to be too tight, the honest options are (a) move the backend to Render's $7/month Starter tier (or an equivalent low-cost persistent host) rather than degrading the model further, since this combination is already close to the practical floor for this kind of embedding-based scoring without an LLM, or (b) confirm with the project owner before making that call — **do not silently swap in a smaller/different model that hasn't been reviewed here** just to force a fit.
