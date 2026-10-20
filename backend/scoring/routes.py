import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, Field

from .config import ADMIN_TOKEN
from .orchestrator import analyze
from .research import get_status, execute_live_research, refresh_brief_background
from .schemas import ResearchStatusResponse

logger = logging.getLogger("sereenify-scoring.routes")

router = APIRouter(tags=["Scoring & Research"])


class AnalyzePayload(BaseModel):
    description: str = Field(..., min_length=1, max_length=2000)


def get_sessions_store():
    # Deferred import to access main.SESSIONS cleanly
    from main import SESSIONS
    return SESSIONS


@router.post("/api/session/{session_id}/analyze")
async def analyze_session(
    session_id: str,
    payload: AnalyzePayload,
    sessions: dict = Depends(get_sessions_store),
):
    session = sessions.get(session_id)
    if not session:
        logger.warning(
            "Session %s not found in store during analyze (possible server restart). Initializing fallback session state.",
            session_id,
        )
        session = {
            "current_portfolio_word": "cherished memory",
            "current_category": "hobby",
            "current_image_alt": None,
        }
        sessions[session_id] = session

    portfolio_word = session.get("current_portfolio_word") or session.get("current_query") or "cherished memory"
    category = session.get("current_category", "hobby")
    image_alt = session.get("current_image_alt")

    return await analyze(
        description=payload.description,
        portfolio_word=portfolio_word,
        category=category,
        image_alt=image_alt,
    )


@router.get("/api/research/status", response_model=ResearchStatusResponse)
async def research_status():
    status_info = get_status()
    return ResearchStatusResponse(**status_info)


@router.post("/api/research/refresh")
async def research_refresh(x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")):
    if not x_admin_token or x_admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Admin-Token")

    try:
        brief_data = await execute_live_research()
        return {
            "status": "refreshed",
            "source_type": brief_data.source_type,
            "generated_at": brief_data.generated_at,
            "source_count": len(brief_data.sources),
            "indicator_count": len(brief_data.indicators),
        }
    except Exception as e:
        logger.error("Admin refresh failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Research refresh failed: {str(e)}")
