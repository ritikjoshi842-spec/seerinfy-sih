import json
import logging
from typing import Any, Dict, List, Optional

from .groq_client import run_agent
from .prompts import (
    LEXICAL_SYSTEM_PROMPT,
    FILLER_SYSTEM_PROMPT,
    SEMANTIC_SYSTEM_PROMPT,
    DEMENTIA_SYSTEM_PROMPT,
)
from .schemas import (
    LexicalResult,
    FillerResult,
    SemanticResult,
    DementiaResult,
)

logger = logging.getLogger("sereenify-scoring.agents")


def sanitize(text: str) -> str:
    """Sanitises untrusted text so it cannot close XML-like wrapper tags."""
    if not text:
        return ""
    return text.replace("<", "").replace(">", "").strip()


async def run_lexical_agent(clean_text: str) -> Dict[str, Any]:
    payload = f"<patient_description>\n{clean_text}\n</patient_description>"
    flags: List[str] = []

    res: LexicalResult = await run_agent(
        name="lexical_diversity",
        system_prompt=LEXICAL_SYSTEM_PROMPT,
        user_payload=payload,
        schema=LexicalResult,
        effort="low",
        max_tokens=500,
    )

    # Consistency check: unique terms cannot exceed total content terms
    if len(res.unique_content_terms) > len(res.content_terms):
        logger.warning("Lexical agent count inconsistency detected. Retrying once...")
        try:
            res = await run_agent(
                name="lexical_diversity",
                system_prompt=LEXICAL_SYSTEM_PROMPT,
                user_payload=payload,
                schema=LexicalResult,
                effort="low",
                max_tokens=500,
            )
        except Exception as e:
            logger.warning("Lexical agent retry failed: %s", e)

        if len(res.unique_content_terms) > len(res.content_terms):
            flags.append("count_mismatch")

    out = {
        "status": "ok",
        "score_pct": res.score_pct,
        "keyword_density_pct": res.keyword_density_pct,
        "unique_ratio_pct": res.unique_ratio_pct,
        "terms": res.unique_content_terms,
        "total_word_count": res.total_word_count,
        "rationale": res.rationale,
    }
    if flags:
        out["flags"] = flags
    return out


async def run_filler_agent(clean_text: str) -> Dict[str, Any]:
    payload = f"<patient_description>\n{clean_text}\n</patient_description>"
    flags: List[str] = []

    res: FillerResult = await run_agent(
        name="filler_word_frequency",
        system_prompt=FILLER_SYSTEM_PROMPT,
        user_payload=payload,
        schema=FillerResult,
        effort="low",
        max_tokens=400,
    )

    # Consistency check: reported filler_count equals length of instances list
    if res.filler_count != len(res.instances):
        logger.warning("Filler agent count mismatch (filler_count=%d != instances=%d). Retrying once...", res.filler_count, len(res.instances))
        try:
            res = await run_agent(
                name="filler_word_frequency",
                system_prompt=FILLER_SYSTEM_PROMPT,
                user_payload=payload,
                schema=FillerResult,
                effort="low",
                max_tokens=400,
            )
        except Exception as e:
            logger.warning("Filler agent retry failed: %s", e)

        if res.filler_count != len(res.instances):
            flags.append("count_mismatch")

    out = {
        "status": "ok",
        "fluency_score_pct": res.fluency_score_pct,
        "filler_rate_pct": res.filler_rate_pct,
        "filler_count": res.filler_count,
        "total_word_count": res.total_word_count,
        "instances": [inst.model_dump() for inst in res.instances],
        "rationale": res.rationale,
    }
    if flags:
        out["flags"] = flags
    return out


async def run_semantic_agent(
    clean_text: str,
    portfolio_word: str,
    category: str,
    image_alt: Optional[str] = None,
) -> Dict[str, Any]:
    clean_word = sanitize(portfolio_word)
    clean_cat = sanitize(category)
    parts = [
        f"<portfolio_word>{clean_word}</portfolio_word>",
        f"<category>{clean_cat}</category>",
    ]
    if image_alt:
        parts.append(f"<image_alt>{sanitize(image_alt)}</image_alt>")
    parts.append(f"<patient_description>\n{clean_text}\n</patient_description>")
    payload = "\n".join(parts)
    flags: List[str] = []

    res: SemanticResult = await run_agent(
        name="semantic_relevance",
        system_prompt=SEMANTIC_SYSTEM_PROMPT,
        user_payload=payload,
        schema=SemanticResult,
        effort="low",
        max_tokens=500,
    )

    out = {
        "status": "ok",
        "score_pct": res.score_pct,
        "term_scores": [t.model_dump() for t in res.term_scores],
        "rationale": res.rationale,
    }
    if flags:
        out["flags"] = flags
    return out


async def run_dementia_agent(clean_text: str, brief: Dict[str, Any]) -> Dict[str, Any]:
    # Ultra-compact indicators for low-token brief context
    compact_indicators = [
        {
            "id": ind.get("id"),
            "name": ind.get("name"),
            "clue": (ind.get("in_picture_description") or ind.get("description", ""))[:45],
        }
        for ind in brief.get("indicators", [])[:7]
    ]
    brief_json = json.dumps(compact_indicators, ensure_ascii=False)

    payload = f"<research_brief>\n{brief_json}\n</research_brief>\n<patient_description>\n{clean_text}\n</patient_description>"
    flags: List[str] = []

    res: DementiaResult = await run_agent(
        name="dementia_contextual_alignment",
        system_prompt=DEMENTIA_SYSTEM_PROMPT,
        user_payload=payload,
        schema=DementiaResult,
        effort="low",
        max_tokens=500,
    )

    out = {
        "status": "ok",
        "alignment_pct": res.alignment_pct,
        "confidence": res.confidence,
        "assessments": [a.model_dump() for a in res.assessments],
        "summary": res.summary,
        "limitations": res.limitations,
        "disclaimer": "Supplementary context only. This is not a diagnosis.",
        "research": {
            "source_type": brief.get("source_type", "cache"),
            "generated_at": brief.get("generated_at", ""),
            "sources": brief.get("sources", []),
        },
    }
    if flags:
        out["flags"] = flags
    return out
