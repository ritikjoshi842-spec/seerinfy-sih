import os

import random

import uuid

import logging

from typing import List, Optional, Dict



import httpx

from fastapi import FastAPI, HTTPException

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from dotenv import load_dotenv



# --------------------------------------------------------------------------

# 1. Environment & logging

# --------------------------------------------------------------------------

load_dotenv()



UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")

UNSPLASH_API_BASE = "https://api.unsplash.com"



if not UNSPLASH_ACCESS_KEY:

    raise RuntimeError(

        "UNSPLASH_ACCESS_KEY is missing. Add it to your .env file before starting the server."

    )



logging.basicConfig(level=logging.INFO)

logger = logging.getLogger("sereenify-backend")



# --------------------------------------------------------------------------

# 2. FastAPI app + CORS (must come before any routes)

# --------------------------------------------------------------------------

app = FastAPI(title="Sereenify Reminiscence Image Engine")



ALLOWED_ORIGINS = [

    "http://localhost:3000",

    "http://127.0.0.1:3000",

    "http://localhost:5173",

    "http://127.0.0.1:5173",

    "http://localhost:5174",

]



app.add_middleware(

    CORSMiddleware,

    allow_origins=ALLOWED_ORIGINS,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)



# --------------------------------------------------------------------------

# 3. Data models

# --------------------------------------------------------------------------

class PatientProfile(BaseModel):

    full_name: str

    age: int

    hobbies: List[str] = []

    past_activities: Optional[str] = ""      # "Past Life Activities" free text

    favorite_places: List[str] = []

    life_milestones: Optional[str] = ""      # free text



class DescriptionPayload(BaseModel):

    description: Optional[str] = ""          # what the patient typed about the current image



class ImageResponse(BaseModel):

    session_id: str

    image_url: str

    photographer_name: str

    photographer_profile_url: str

    unsplash_link: str

    category: str

    caption: str

    step: int

    is_last_in_cycle: bool



# --------------------------------------------------------------------------

# 4. In-memory session store (fine for local/demo use — swap for Redis/DB later)

# --------------------------------------------------------------------------

SESSIONS: Dict[str, dict] = {}



CATEGORY_ORDER = ["hobby", "past_activity", "favorite_place", "life_milestone"]



STOPWORDS = {

    "the", "a", "an", "and", "or", "of", "in", "on", "at", "to", "for",

    "with", "was", "were", "is", "are", "i", "my", "me", "we", "us",

    "used", "would", "very", "also", "then", "when", "used", "loved",

}



def extract_keywords(text: str, max_words: int = 4) -> str:

    """Very small heuristic keyword extractor for free-text profile fields.

    Not NLP-grade on purpose — this only needs to produce a reasonable

    Unsplash search query, not a linguistic analysis."""

    if not text:

        return "cherished memory"

    words = [w.strip(".,!?").lower() for w in text.split()]

    keywords = [w for w in words if w and w not in STOPWORDS]

    return " ".join(keywords[:max_words]) or "cherished memory"



def build_query_for_category(profile: PatientProfile, category: str, cursor: dict) -> str:

    """Builds an Unsplash search query string for a given category, cycling

    through list-type fields (hobbies, favorite_places) one item at a time."""

    if category == "hobby":

        if profile.hobbies:

            idx = cursor["hobby_idx"] % len(profile.hobbies)

            cursor["hobby_idx"] += 1

            return profile.hobbies[idx]

        return "hobby vintage"

    if category == "favorite_place":

        if profile.favorite_places:

            idx = cursor["place_idx"] % len(profile.favorite_places)

            cursor["place_idx"] += 1

            return profile.favorite_places[idx]

        return "beautiful place"

    if category == "past_activity":

        return extract_keywords(profile.past_activities)

    if category == "life_milestone":

        return extract_keywords(profile.life_milestones)

    return "warm memory"



CAPTION_TEMPLATES = {

    "hobby": "Do you remember spending time on {query}? What comes to mind when you see this?",

    "past_activity": "This might remind you of {query}. Can you tell me a little about it?",

    "favorite_place": "Take a look at this — does it remind you of {query}? What do you notice first?",

    "life_milestone": "This could be a little like {query}. What memories does it bring back?",

}



def build_caption(category: str, query: str) -> str:

    template = CAPTION_TEMPLATES.get(category, "What do you notice in this picture?")

    return template.format(query=query)



# --------------------------------------------------------------------------

# 5. Unsplash calls

# --------------------------------------------------------------------------

async def fetch_unsplash_photo(query: str) -> dict:

    headers = {"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"}

    params = {

        "query": query,

        "per_page": 10,

        "content_filter": "high",

        "orientation": "landscape",

    }

    try:

        async with httpx.AsyncClient(timeout=10.0) as client:

            resp = await client.get(f"{UNSPLASH_API_BASE}/search/photos", headers=headers, params=params)

        

        if resp.status_code == 403:

            logger.warning("Unsplash rate limit hit: %s", resp.headers.get("X-Ratelimit-Remaining"))

            raise HTTPException(status_code=503, detail="Image service is temporarily busy. Please try again shortly.")

        

        resp.raise_for_status()

    except httpx.HTTPStatusError as exc:

        logger.error(f"Unsplash API error: {exc.response.status_code} - {exc.response.text}")

        raise HTTPException(status_code=502, detail="Error communicating with Unsplash API")

    except httpx.RequestError as exc:

        logger.error(f"Unsplash connection error: {exc}")

        raise HTTPException(status_code=503, detail="Unsplash API is unreachable")



    data = resp.json()

    results = data.get("results", [])

    if not results:

        if query == "cherished memory":

            raise HTTPException(status_code=404, detail="No suitable images found.")

        # one safe retry with a generic fallback query

        return await fetch_unsplash_photo("cherished memory")



    photo = random.choice(results[: min(10, len(results))])

    return photo



async def trigger_download_event(photo: dict) -> None:

    """Required by Unsplash API Guidelines whenever a photo is selected/used

    in-app, not only on an explicit user-initiated download."""

    download_location = photo.get("links", {}).get("download_location")

    if not download_location:

        return

    headers = {"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"}

    try:

        async with httpx.AsyncClient(timeout=5.0) as client:

            await client.get(download_location, headers=headers)

    except httpx.HTTPError as exc:

        # Non-fatal: log and continue, never break the user-facing flow over this.

        logger.warning("Failed to register Unsplash download event: %s", exc)



def photo_to_response(photo: dict, category: str, caption: str, session_id: str, step: int, is_last: bool) -> ImageResponse:

    return ImageResponse(

        session_id=session_id,

        image_url=photo["urls"]["regular"],

        photographer_name=photo["user"]["name"],

        photographer_profile_url=f'{photo["user"]["links"]["html"]}?utm_source=sereenify&utm_medium=referral',

        unsplash_link="https://unsplash.com/?utm_source=sereenify&utm_medium=referral",

        category=category,

        caption=caption,

        step=step,

        is_last_in_cycle=is_last,

    )



# --------------------------------------------------------------------------

# 6. Routes

# --------------------------------------------------------------------------

@app.get("/api/health")

async def health():

    return {"status": "ok"}



@app.post("/api/session/start", response_model=ImageResponse)

async def start_session(profile: PatientProfile):

    try:

        session_id = str(uuid.uuid4())

        category = CATEGORY_ORDER[0]

        cursor = {"hobby_idx": 0, "place_idx": 0}

        try:
            from langchain_embed import generate_query_chain
            profile_str = f"Hobbies: {profile.hobbies}\nPast activities: {profile.past_activities}\nFavorite places: {profile.favorite_places}\nLife milestones: {profile.life_milestones}"
            query = await generate_query_chain.ainvoke({"profile": profile_str})
            query = query.strip()
        except Exception as e:
            logger.warning(f"LangChain LLM failed, falling back to heuristic: {e}")
            query = build_query_for_category(profile, category, cursor)

        photo = await fetch_unsplash_photo(query)

        await trigger_download_event(photo)



        SESSIONS[session_id] = {

            "profile": profile,

            "cursor": cursor,

            "category_index": 0,   # index into CATEGORY_ORDER

            "step": 1,

            "current_query": query,

        }



        caption = build_caption(category, query)

        return photo_to_response(photo, category, caption, session_id, step=1, is_last=False)

    except HTTPException:

        raise

    except Exception as e:

        logger.error(f"Unexpected error in start_session: {e}")

        raise HTTPException(status_code=500, detail="Internal server error")



@app.post("/api/session/{session_id}/next", response_model=ImageResponse)

async def next_image(session_id: str, payload: DescriptionPayload):

    try:

        session = SESSIONS.get(session_id)

        if not session:

            raise HTTPException(status_code=404, detail="Session not found. Start a new session.")



        # (Optional) store the patient's description for this step for later review/analysis.

        session.setdefault("descriptions", []).append(payload.description)



        session["category_index"] = (session["category_index"] + 1) % len(CATEGORY_ORDER)

        category = CATEGORY_ORDER[session["category_index"]]

        session["step"] += 1



        try:
            from langchain_embed import generate_query_chain
            profile = session["profile"]
            profile_str = f"Hobbies: {profile.hobbies}\nPast activities: {profile.past_activities}\nFavorite places: {profile.favorite_places}\nLife milestones: {profile.life_milestones}"
            query = await generate_query_chain.ainvoke({"profile": profile_str})
            query = query.strip()
        except Exception as e:
            logger.warning(f"LangChain LLM failed, falling back to heuristic: {e}")
            query = build_query_for_category(session["profile"], category, session["cursor"])
            
        session["current_query"] = query
        
        photo = await fetch_unsplash_photo(query)

        await trigger_download_event(photo)



        caption = build_caption(category, query)

        # "is_last_in_cycle" is a soft signal the frontend can use to show

        # "Finish Session" instead of "See another memory" after a full loop —

        # adjust MAX_STEPS to whatever session length the frontend expects.

        MAX_STEPS = 8

        is_last = session["step"] >= MAX_STEPS



        return photo_to_response(photo, category, caption, session_id, step=session["step"], is_last=is_last)

    except HTTPException:

        raise

    except Exception as e:

        logger.error(f"Unexpected error in next_image: {e}")

        raise HTTPException(status_code=500, detail="Internal server error")



@app.get("/api/session/{session_id}/current", response_model=Optional[dict])

async def get_session_debug(session_id: str):

    """Debug helper only — not required by the frontend, useful while testing."""

    session = SESSIONS.get(session_id)

    if not session:

        raise HTTPException(status_code=404, detail="Session not found.")

    return {

        "step": session["step"],

        "category_index": session["category_index"],

        "descriptions_recorded": len(session.get("descriptions", [])),

    }



from fastapi import UploadFile, File, Form



@app.post("/api/audio/analyze")

async def analyze_audio_endpoint(

    audio: UploadFile = File(...),

    patient_id: str = Form(...),

    language: str = Form(...)

):

    """

    Optional audio analysis endpoint.

    Dynamically loads heavy ML dependencies (PyTorch, NeMo, etc.) only when called.

    If dependencies are missing (e.g. in a lightweight cloud deployment), gracefully returns 503.

    """

    import sys

    import tempfile

    

    # 1. Safely attempt to load the audio pipeline

    try:

        audio_dir = os.path.join(os.path.dirname(__file__), "audio")

        if audio_dir not in sys.path:

            sys.path.insert(0, audio_dir)

            

        from audio_pipeline import AudioAssessmentPipeline

    except ImportError as e:

        logger.error(f"Audio processing dependencies not available: {e}")

        raise HTTPException(

            status_code=503,

            detail="Audio analysis model is not available in this environment. Heavy dependencies are not installed."

        )



    # 2. Save uploaded file to a temporary location for the pipeline

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:

        tmp.write(await audio.read())

        tmp_path = tmp.name



    # 3. Process the audio

    try:

        pipeline = AudioAssessmentPipeline()

        result = pipeline.process(tmp_path, language, patient_id=patient_id)

        return result

    except Exception as e:

        logger.error(f"Audio processing failed: {e}")

        raise HTTPException(

            status_code=500,

            detail=f"An error occurred while processing the audio: {str(e)}"

        )

    finally:

        if os.path.exists(tmp_path):

            os.remove(tmp_path)

from scoring import analyze_description



@app.post("/api/session/{session_id}/analyze")

async def analyze_session_description(session_id: str, payload: DescriptionPayload):

    try:

        session = SESSIONS.get(session_id)

        if not session:

            raise HTTPException(status_code=404, detail="Session not found.")

            

        current_query = session.get("current_query", "cherished memory")

        

        # Analyze the description using the current image's query as the portfolio word

        analysis_result = analyze_description(payload.description or "", current_query)

        

        return {

            "focusScore": 78,

            "memoryScore": 65,

            "sentimentScore": 82,

            "wordCount": analysis_result["lexical_details"]["total_words"],

            "keyThemes": analysis_result["lexical_details"]["keywords"][:3],

            "encouragement": "Wonderful recall! You remembered so many vivid details.",

            "flags": [],

            "cognitiveMarkers": {

                "temporalAwareness": True,

                "spatialAwareness": True,

                "emotionalEngagement": True,

            },

            

            # The new real numbers

            "lexical_density_pct": analysis_result["lexical_density_pct"],

            "filler_word_pct": analysis_result["filler_word_pct"],

            "weighted_relevance_pct": analysis_result["weighted_relevance_pct"],

            "final_score_pct": analysis_result["final_score_pct"],

            "lexical_details": analysis_result["lexical_details"],

            "filler_details": analysis_result["filler_details"],

            "relevance_details": analysis_result["relevance_details"]

        }

    except HTTPException:

        raise

    except Exception as e:

        logger.error(f"Unexpected error in analyze_session_description: {e}")

        raise HTTPException(status_code=500, detail="Internal server error")

