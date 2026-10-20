import asyncio
import hashlib
import logging
import time
import uuid
from typing import Any, Dict, Optional, Tuple
from fastapi import HTTPException
from groq import RateLimitError

from .agents import (
    sanitize,
    run_lexical_agent,
    run_filler_agent,
    run_semantic_agent,
    run_dementia_agent,
)
from .config import (
    GROQ_MODEL,
    ANALYSIS_CACHE_TTL_SECONDS,
    ANALYSIS_CACHE_MAX_SIZE,
)
from .research import get_brief

logger = logging.getLogger("sereenify-scoring.orchestrator")

# In-memory cache for analysis results: key -> (timestamp, response_data)
_analysis_cache: Dict[Tuple[str, str], Tuple[float, Dict[str, Any]]] = {}


def _get_cache_key(description: str, portfolio_word: str) -> Tuple[str, str]:
    text_hash = hashlib.sha256(description.strip().lower().encode("utf-8")).hexdigest()
    return (text_hash, portfolio_word.strip().lower())


def _get_cached_result(key: Tuple[str, str]) -> Optional[Dict[str, Any]]:
    if key in _analysis_cache:
        timestamp, data = _analysis_cache[key]
        if time.time() - timestamp < ANALYSIS_CACHE_TTL_SECONDS:
            # Return fresh copy with a new analysis_id
            cached_copy = dict(data)
            cached_copy["analysis_id"] = str(uuid.uuid4())
            cached_copy["from_cache"] = True
            return cached_copy
        else:
            del _analysis_cache[key]
    return None


def _set_cached_result(key: Tuple[str, str], data: Dict[str, Any]):
    if len(_analysis_cache) >= ANALYSIS_CACHE_MAX_SIZE:
        # Evict oldest entry
        oldest_k = min(_analysis_cache.keys(), key=lambda k: _analysis_cache[k][0])
        del _analysis_cache[oldest_k]
    _analysis_cache[key] = (time.time(), data)


async def analyze(
    *,
    description: str,
    portfolio_word: str,
    category: str,
    image_alt: Optional[str] = None,
) -> Dict[str, Any]:
    # 1. Check cache
    cache_key = _get_cache_key(description, portfolio_word)
    cached = _get_cached_result(cache_key)
    if cached:
        logger.info("Serving analysis from cache for key %s", cache_key)
        return cached

    clean_text = sanitize(description)

    # 2. Get research brief (fast, never blocks on network)
    brief = await get_brief()

    # 3. Run all four agents concurrently with timeout
    tasks = [
        run_lexical_agent(clean_text),
        run_filler_agent(clean_text),
        run_semantic_agent(clean_text, portfolio_word, category, image_alt),
        run_dementia_agent(clean_text, brief),
    ]

    try:
        results = await asyncio.wait_for(
            asyncio.gather(*tasks, return_exceptions=True),
            timeout=60.0,
        )
    except asyncio.TimeoutError:
        logger.error("Analysis orchestrator timed out after 45s")
        raise HTTPException(
            status_code=504,
            detail="The analysis service timed out. Please try again.",
        )

    lex_res, fil_res, sem_res, dem_res = results

    # 4. Check if all failed due to rate limits
    rate_limit_exceptions = [
        r for r in results if isinstance(r, RateLimitError) or (isinstance(r, Exception) and "429" in str(r))
    ]
    if len(rate_limit_exceptions) == 4:
        logger.error("All 4 scoring agents hit rate limits (429)")
        raise HTTPException(
            status_code=503,
            detail="The analysis service is busy. Please try again in a moment.",
        )

    # 5. Helper to unpack agent outcome (individual failures return {"status": "unavailable"})
    def unpack(res: Any, name: str) -> Dict[str, Any]:
        if isinstance(res, Exception):
            logger.error("Agent '%s' failed with error: %s", name, res)
            return {"status": "unavailable"}
        if isinstance(res, dict):
            return res
        return {"status": "unavailable"}

    response_data = {
        "analysis_id": str(uuid.uuid4()),
        "model": GROQ_MODEL,
        "lexical_diversity": unpack(lex_res, "lexical_diversity"),
        "filler_word_frequency": unpack(fil_res, "filler_word_frequency"),
        "semantic_relevance": unpack(sem_res, "semantic_relevance"),
        "dementia_contextual_alignment": unpack(dem_res, "dementia_contextual_alignment"),
    }

    # Only cache if at least one agent succeeded
    statuses = [
        response_data["lexical_diversity"].get("status"),
        response_data["filler_word_frequency"].get("status"),
        response_data["semantic_relevance"].get("status"),
        response_data["dementia_contextual_alignment"].get("status"),
    ]
    if any(s == "ok" for s in statuses):
        _set_cached_result(cache_key, response_data)

    return response_data
