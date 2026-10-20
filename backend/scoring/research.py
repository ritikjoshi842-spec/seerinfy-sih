import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from .config import (
    RESEARCH_SEED_PATH,
    RESEARCH_BRIEF_PATH,
    RESEARCH_TTL_HOURS,
)
from .prompts import DISTILLER_SYSTEM_PROMPT
from .schemas import ResearchBriefLLM, ResearchBriefData, Indicator, ResearchSource
from .groq_client import run_agent
from .tinyfish_client import search, fetch, TinyFishError

logger = logging.getLogger("sereenify-scoring.research")

PURPOSE = "Find published evidence on speech and language patterns in picture/photo descriptions by people with Alzheimer's disease or dementia"

RESEARCH_QUERIES = [
    dict(
        query="picture description task Alzheimer's disease linguistic markers lexical diversity",
        domain_type="research_paper",
        pub_year_min=2018,
        purpose=PURPOSE,
    ),
    dict(
        query="spontaneous speech filler words disfluency hesitation dementia",
        domain_type="research_paper",
        pub_year_min=2018,
        purpose=PURPOSE,
    ),
    dict(
        query="early signs Alzheimer's communication changes word-finding vague language repetition",
        include_domains=["alz.org", "nia.nih.gov", "alzint.org", "ncbi.nlm.nih.gov"],
        purpose=PURPOSE,
    ),
    dict(
        query="reminiscence therapy dementia language responses to photographs",
        include_domains=["alz.org", "nia.nih.gov", "ncbi.nlm.nih.gov"],
        purpose=PURPOSE,
    ),
]

TRUSTED_DOMAINS = [
    "nih.gov",
    "ncbi.nlm.nih.gov",
    "alz.org",
    "alzint.org",
    "nia.nih.gov",
    "frontiersin.org",
    "nature.com",
    "plos.org",
    "springer.com",
]

_refresh_lock = asyncio.Lock()
_in_memory_brief: Optional[Dict[str, Any]] = None


def _load_json_file(path: Path) -> Optional[Dict[str, Any]]:
    if not path.exists():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed to read JSON file %s: %s", path, e)
        return None


def _is_cache_fresh(brief_data: Dict[str, Any]) -> bool:
    gen_str = brief_data.get("generated_at")
    if not gen_str:
        return False
    try:
        gen_time = datetime.fromisoformat(gen_str.replace("Z", "+00:00"))
        age_hours = (datetime.now(timezone.utc) - gen_time).total_seconds() / 3600.0
        return age_hours < RESEARCH_TTL_HOURS
    except Exception as e:
        logger.warning("Could not parse generated_at timestamp '%s': %s", gen_str, e)
        return False


def _rank_search_results(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    def rank_key(item: Dict[str, Any]):
        url = item.get("url", "").lower()
        domain = urlparse(url).netloc
        is_trusted = any(td in domain for td in TRUSTED_DOMAINS)
        citation_count = item.get("cited_by_count") or 0
        try:
            citations = int(citation_count)
        except (ValueError, TypeError):
            citations = 0
        return (1 if is_trusted else 0, citations)

    return sorted(results, key=rank_key, reverse=True)


async def execute_live_research() -> ResearchBriefData:
    logger.info("Executing live TinyFish research pipeline...")

    # Step 1 & 2: Run 4 searches sequentially (1s apart) and deduplicate by URL
    all_results: List[Dict[str, Any]] = []
    seen_urls = set()

    for i, q in enumerate(RESEARCH_QUERIES):
        if i > 0:
            await asyncio.sleep(1.0)
        try:
            results = await search(**q)
            for res in results:
                url = res.get("url")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    all_results.append(res)
        except Exception as e:
            logger.warning("Search query %d failed: %s", i + 1, e)

    if not all_results:
        raise TinyFishError("All research search queries returned no results")

    # Step 3: Rank trusted hosts first, then citation count; take top 4
    ranked = _rank_search_results(all_results)
    top_4 = ranked[:4]
    top_urls = [r["url"] for r in top_4]

    # Step 4: Fetch those 4 URLs in one call
    fetched_results, fetched_errors = await fetch(
        top_urls, purpose=PURPOSE, ttl=86400
    )

    fetched_dict = {f.get("url"): f for f in fetched_results if isinstance(f, dict)}
    error_urls = {e.get("url") for e in fetched_errors if isinstance(e, dict)}

    sources_content: List[Dict[str, str]] = []
    sources_meta: List[ResearchSource] = []

    for item in top_4:
        url = item.get("url", "")
        title = item.get("title", "Research Article")
        text = ""

        if url in fetched_dict and fetched_dict[url].get("text"):
            text = (fetched_dict[url]["text"] or "").strip()[:2400]
        elif url in error_urls or not text:
            # Fall back to search snippet
            text = (item.get("snippet") or item.get("description") or "").strip()[:2400]

        if not text:
            text = title

        sources_content.append({"url": url, "title": title, "text": text})
        sources_meta.append(ResearchSource(title=title, url=url))

    valid_urls_set = {s.url for s in sources_meta}

    # Step 5: Distill with Groq
    sources_xml_parts = ["<sources>"]
    for s in sources_content:
        sources_xml_parts.append(
            f'<source url="{s["url"]}">\n<title>{s["title"]}</title>\n<content>\n{s["text"]}\n</content>\n</source>'
        )
    sources_xml_parts.append("</sources>")
    user_payload = "\n".join(sources_xml_parts)

    distilled: ResearchBriefLLM = await run_agent(
        name="research_distiller",
        system_prompt=DISTILLER_SYSTEM_PROMPT,
        user_payload=user_payload,
        schema=ResearchBriefLLM,
        effort="medium",
        max_tokens=4000,
    )

    # Step 6: Validate
    # Drop any source_urls entry not in provided sources
    validated_indicators: List[Indicator] = []
    for ind in distilled.indicators:
        clean_urls = [u for u in ind.source_urls if u in valid_urls_set]
        # if LLM invented a URL or dropped them, fallback to all valid sources or top source
        if not clean_urls and sources_meta:
            clean_urls = [sources_meta[0].url]
        validated_indicators.append(
            Indicator(
                id=ind.id,
                name=ind.name,
                description=ind.description[:200],
                in_picture_description=ind.in_picture_description[:200],
                source_urls=clean_urls,
            )
        )

    if len(validated_indicators) < 5 or len(validated_indicators) > 10:
        raise ValueError(
            f"Distiller produced {len(validated_indicators)} indicators (expected 5-10)"
        )

    brief_data = ResearchBriefData(
        generated_at=datetime.now(timezone.utc).isoformat(),
        source_type="live",
        sources=sources_meta,
        indicators=validated_indicators,
        caveats=distilled.caveats,
    )

    # Step 7: Persist to runtime cache
    try:
        with open(RESEARCH_BRIEF_PATH, "w", encoding="utf-8") as f:
            json.dump(brief_data.model_dump(), f, indent=2)
        logger.info("Successfully persisted live research brief to %s", RESEARCH_BRIEF_PATH)
    except Exception as e:
        logger.error("Failed to save research brief to disk: %s", e)

    return brief_data


async def refresh_brief_background():
    """Guarded by an asyncio.Lock so only one background refresh runs."""
    if _refresh_lock.locked():
        logger.info("A research refresh is already in progress, skipping duplicate.")
        return

    async with _refresh_lock:
        logger.info("Starting background research refresh...")
        try:
            brief_data = await execute_live_research()
            global _in_memory_brief
            _in_memory_brief = brief_data.model_dump()
            logger.info("Background research refresh completed successfully.")
        except Exception as e:
            logger.warning("Background research refresh could not complete (%s). Retaining current brief.", e)


async def get_brief() -> Dict[str, Any]:
    """Returns the research brief immediately without blocking on network requests."""
    global _in_memory_brief

    # 1. Check in-memory brief
    if _in_memory_brief is not None and _is_cache_fresh(_in_memory_brief):
        data = dict(_in_memory_brief)
        data["source_type"] = "cache"
        return data

    # 2. Check disk cache
    cached_data = _load_json_file(RESEARCH_BRIEF_PATH)
    if cached_data and _is_cache_fresh(cached_data):
        _in_memory_brief = cached_data
        data = dict(cached_data)
        data["source_type"] = "cache"
        return data

    # 3. If stale cache exists, return it and trigger background refresh
    if cached_data:
        data = dict(cached_data)
        data["source_type"] = "stale"
        if not _refresh_lock.locked():
            asyncio.create_task(refresh_brief_background())
        return data

    # 4. If cache missing, load seed brief and trigger background refresh
    seed_data = _load_json_file(RESEARCH_SEED_PATH)
    if seed_data:
        data = dict(seed_data)
        data["source_type"] = "fallback"
        if not _refresh_lock.locked():
            asyncio.create_task(refresh_brief_background())
        return data

    # 5. Fallback emergency empty brief
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_type": "fallback_unverified",
        "sources": [],
        "indicators": [],
        "caveats": ["Linguistic observations are supplementary and non-diagnostic."],
    }


def get_status() -> Dict[str, Any]:
    """Status helper for GET /api/research/status."""
    cached_data = _load_json_file(RESEARCH_BRIEF_PATH)
    if cached_data:
        source_type = "cache" if _is_cache_fresh(cached_data) else "stale"
        return {
            "source_type": source_type,
            "generated_at": cached_data.get("generated_at", ""),
            "source_count": len(cached_data.get("sources", [])),
        }
    seed_data = _load_json_file(RESEARCH_SEED_PATH)
    if seed_data:
        return {
            "source_type": "fallback",
            "generated_at": seed_data.get("generated_at", ""),
            "source_count": len(seed_data.get("sources", [])),
        }
    return {
        "source_type": "none",
        "generated_at": "",
        "source_count": 0,
    }
