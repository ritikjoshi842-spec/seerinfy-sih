from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, field_validator


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


def _pct(v: Any) -> int:
    """Clamps a numeric score to an integer between 0 and 100."""
    try:
        val = float(v)
        return max(0, min(100, int(round(val))))
    except Exception:
        return 0


# --- Agent 1: Lexical Diversity ---
class LexicalResult(Strict):
    total_word_count: int
    content_terms: list[str]
    unique_content_terms: list[str]
    keyword_density_pct: float
    unique_ratio_pct: float
    score_pct: int
    rationale: str

    @field_validator("score_pct")
    @classmethod
    def validate_score(cls, v: Any) -> int:
        return _pct(v)


# --- Agent 2: Filler-Word Frequency ---
class FillerInstance(Strict):
    text: str
    kind: Literal["hesitation", "discourse_marker"]
    context: str


class FillerResult(Strict):
    total_word_count: int
    instances: list[FillerInstance]
    filler_count: int
    filler_rate_pct: float
    fluency_score_pct: int
    rationale: str

    @field_validator("fluency_score_pct")
    @classmethod
    def validate_score(cls, v: Any) -> int:
        return _pct(v)


# --- Agent 3: Semantic Relevance ---
class TermRelevance(Strict):
    term: str
    weight_class: Literal["high", "medium", "low"]
    weight: float
    relevance: float  # 0.0 - 1.0 continuous


class SemanticResult(Strict):
    term_scores: list[TermRelevance]
    score_pct: int
    rationale: str

    @field_validator("score_pct")
    @classmethod
    def validate_score(cls, v: Any) -> int:
        return _pct(v)


# --- Agent 4: Dementia-Contextual Alignment ---
class IndicatorAssessment(Strict):
    indicator_id: str
    status: Literal["observed", "partially_observed", "not_observed", "not_assessable"]
    evidence: str  # verbatim quote <= 12 words, or ""


class DementiaResult(Strict):
    assessments: list[IndicatorAssessment]
    alignment_pct: int
    confidence: Literal["low", "medium", "high"]
    summary: str
    limitations: str

    @field_validator("alignment_pct")
    @classmethod
    def validate_score(cls, v: Any) -> int:
        return _pct(v)


# --- Research Agent & Distiller ---
class Indicator(Strict):
    id: str
    name: str
    description: str
    in_picture_description: str
    source_urls: list[str]


class ResearchBriefLLM(Strict):
    indicators: list[Indicator]
    caveats: list[str]


class ResearchSource(Strict):
    title: str
    url: str


class ResearchBriefData(Strict):
    generated_at: str
    source_type: str  # "live", "cache", "fallback", "fallback_unverified", "stale"
    sources: list[ResearchSource]
    indicators: list[Indicator]
    caveats: list[str]


# --- API Request & Response Schemas ---
class AnalyzeRequest(BaseModel):
    description: str


class ResearchStatusResponse(BaseModel):
    source_type: str
    generated_at: str
    source_count: int
