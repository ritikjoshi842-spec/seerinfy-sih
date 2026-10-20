import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
try:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass

RESEARCH_SEED_PATH = DATA_DIR / "research_seed.json"
RESEARCH_BRIEF_PATH = (
    Path("/tmp/research_brief.json")
    if os.environ.get("VERCEL")
    else (DATA_DIR / "research_brief.json")
)

GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

# Prompt calculation weights (interpolated in system prompts)
LEXICAL_W_DENSITY = 0.5
LEXICAL_W_UNIQUE = 0.5
FILLER_PENALTY_PER_PCT = 5

# Research cache configuration
RESEARCH_TTL_HOURS = int(os.getenv("RESEARCH_TTL_HOURS", "168"))  # 7 days

# Admin token for refresh endpoint
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "serenify-admin-secret")

# In-memory analysis cache
ANALYSIS_CACHE_TTL_SECONDS = 3600  # 1 hour
ANALYSIS_CACHE_MAX_SIZE = 256
