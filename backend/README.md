# PROMPT / BUILD SPEC — Sereenify Backend: Unsplash-Powered Reminiscence Image Engine (FastAPI)

> **How to use this file:** This is a step-by-step build prompt meant to be handed to an AI coding agent (or followed manually) to build the backend for the Sereenify image-therapy flow. It assumes the **frontend already exists** (built in JS/React, per the project's frontend LLD) and must **not be rebuilt or restructured** — only wired up to the new backend endpoints described here. Follow every step in order. Do not skip the CORS section — it is written to be copy-pasted exactly as-is so no localhost testing issues occur.

---

## 0. A Note on Source Material

This spec follows Unsplash's own documented integration method — register a developer app → get an **Access Key** (and a Secret Key reserved for future OAuth use) → call the Unsplash REST API with the Access Key as a `Client-ID` bearer credential → respect attribution and download-trigger rules → respect the demo rate limit. This is the standard method taught in Unsplash API walkthroughs (register app, `.env` for keys, authenticated `requests`/`httpx` calls, JSON parsing, displaying `urls.regular`, crediting the photographer). If the specific tutorial you watched does something differently in a way that matters (e.g. a different endpoint choice), treat this document as the base and adjust only that detail — the architecture, CORS setup, and category-rotation logic below are independent of that and should be built exactly as specified.

---

## 1. What We're Building

A **FastAPI backend** (`main.py`) that sits between the existing React frontend and the Unsplash API. It does **not** generate images with AI — it intelligently **searches Unsplash** for a photo that matches one slice of the patient's profile data (a hobby, a past activity, a favorite place, a life milestone), and serves that photo **one at a time**, in a fixed rotating order, exactly like the "one picture at a time, then describe it, then click an arrow for the next one" flow already built into the frontend.

### 1.1 The exact flow this backend must support

1. Frontend collects patient profile data (hobbies, past activities/occupation, favorite places, life milestones) and `POST`s it to the backend.
2. Backend picks the **first category** (hobbies), builds an Unsplash search query from it, fetches **one photo**, and returns it to the frontend along with a gentle caption/prompt.
3. Frontend shows the image and a text box for the patient to describe it. (Already built — do not touch.)
4. Patient clicks the **arrow button**. Frontend sends the description (optional, for record-keeping) and asks the backend for the **next image**.
5. Backend moves to the **next category** in the rotation (e.g. hobbies → past occupation → favorite places → life milestones → back to hobbies …), builds a new query, fetches a new photo, returns it.
6. This repeats for the length of the session. Every image must come from a **different category than the one before it** — this is the core rule.

---

## 2. Prerequisites

- Python 3.10+
- An Unsplash Developer account with a registered application (already done — you have an **Access Key** and a **Secret Key**)
- The existing frontend, running locally (Vite default `http://localhost:5173` or CRA default `http://localhost:3000` — confirm which one is actually in use before running the CORS step)

### 2.1 Install dependencies

Create/update `requirements.txt` in the backend folder:

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
python-dotenv==1.0.1
httpx==0.27.2
pydantic==2.9.2
```

Install:

```bash
pip install -r requirements.txt
```

> Do not substitute `requests` for `httpx` — `httpx` is used here because it supports async calls, which FastAPI route handlers need (`async def`) to avoid blocking the event loop while waiting on the Unsplash API.

---

## 3. `.env` File

You've already pasted your keys in. Confirm the file (in the same folder as `main.py`) looks exactly like this — **variable names matter, the code below reads these exact names**:

```
UNSPLASH_ACCESS_KEY=your_access_key_here
UNSPLASH_SECRET_KEY=your_secret_key_here
```

Notes:
- The **Access Key** is the only key actually used by the code below (it authenticates public, read-only calls like search and download-trigger).
- The **Secret Key** is only needed if you later add full OAuth user-login flows with Unsplash. It is not used anywhere in this backend. Keep it in `.env` for future-proofing, but do not wire it into any request — this is intentional, not an oversight.
- Add `.env` to `.gitignore` if it isn't already there. Never hardcode the keys directly in `main.py`.
- **Never expose either key to the frontend.** The frontend must never call `api.unsplash.com` directly — it only ever calls your FastAPI backend. This is also what keeps you out of CORS trouble with Unsplash's own servers (see Section 6).

---

## 4. Project Structure

```
backend/
  main.py
  requirements.txt
  .env
  .gitignore
```

Everything for this task lives in a single `main.py` for simplicity, as requested. Do not create a `frontend/` folder or touch any existing frontend files — the frontend is already built.

---

## 5. Unsplash API — Method Being Used (step by step)

This is the exact mechanism `main.py` implements. Read this before touching the code so every request the agent writes makes sense.

1. **Authentication:** Every request to `api.unsplash.com` must carry a header:
   `Authorization: Client-ID <UNSPLASH_ACCESS_KEY>`
   This is a read-only, unauthenticated-user style call — no OAuth token exchange needed for search/random endpoints.

2. **Search endpoint:** `GET https://api.unsplash.com/search/photos`
   Query params: `query` (the search term built from profile data), `per_page` (fetch ~10 candidates), `content_filter=high` (keeps results appropriate — important given the elderly/patient audience), `orientation=landscape` (matches the `4:3`/landscape `ImageCard` in the frontend).

3. **Picking one photo:** Take the `results` array from the JSON response and pick **one at random** from the top 10 (not always index `0`) so repeated sessions with the same category don't always show the identical photo. If `results` is empty, fall back to a safe default query (e.g. `"warm memory"`) and retry once before giving up.

4. **What gets sent to the frontend:** never the raw Unsplash payload — a clean, minimal object:
   - `image_url` → `results[i].urls.regular`
   - `photographer_name` → `results[i].user.name`
   - `photographer_profile_url` → `results[i].user.links.html` (append `?utm_source=sereenify&utm_medium=referral`, which Unsplash's guidelines require on attribution links)
   - `unsplash_link` → `"https://unsplash.com/?utm_source=sereenify&utm_medium=referral"`
   - `category` → which profile category this image came from (`hobby`, `past_activity`, `favorite_place`, `life_milestone`)
   - `caption` → a gentle, generated reminiscence prompt (see Section 7.4)

5. **Triggering the download endpoint (required by Unsplash's API Guidelines):** Any time your application "uses" a photo (which includes selecting and showing it to a user, not just letting them click an explicit download button), Unsplash requires you to `GET` the photo's `links.download_location` URL (also with the `Client-ID` auth header) to register the usage. Do this **server-side, immediately after you pick the photo**, fire-and-forget (don't block the response waiting on it, but do log if it fails). This keeps the whole integration compliant with Unsplash's terms.

6. **Rate limit:** In demo mode you get **50 requests/hour**. Each "next image" click = 1 search call + 1 download-trigger call = 2 requests. Budget for that while testing — don't loop-click "next" 30 times while debugging or you'll get `403 Rate Limit Exceeded` for the rest of the hour. If you hit the limit, Unsplash returns HTTP 403 with an `X-Ratelimit-Remaining: 0` header — the code below surfaces this as a clean `503` to the frontend instead of a raw crash.

---

## 6. CORS & Middleware — Read This Before Running Anything

This is the part most likely to break local testing if done out of order, so it is spelled out explicitly.

### 6.1 Why CORS will otherwise fail here

Your frontend (`http://localhost:5173` or `http://localhost:3000`) and your backend (`http://localhost:8000`) are **different origins** even though both are "localhost" — different ports count as different origins under the browser's same-origin policy. Without explicit CORS configuration, the browser will block every `fetch()`/`axios` call from the frontend to FastAPI with a console error like:

```
Access to fetch at 'http://localhost:8000/api/session/start' from origin 'http://localhost:5173'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.
```

### 6.2 The fix (add this exactly, immediately after creating the `FastAPI()` instance)

```python
from fastapi.middleware.cors import CORSMiddleware

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",   # Vite sometimes bumps the port if 5173 is busy
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6.3 Rules to not break this later

- `allow_origins` must be an **explicit list**, never `["*"]`, because `allow_credentials=True` and a wildcard origin are mutually incompatible under the CORS spec (browsers will silently reject it). If you don't need cookies/credentials at all, you may drop `allow_credentials` to `False` and use `["*"]` instead — but the explicit list above is safer and already covers every port this project will use.
- The middleware must be added **before the app starts serving**, i.e. right after `app = FastAPI(...)`, before any `@app.get`/`@app.post` decorators are defined. Order in the file doesn't strictly matter for FastAPI (middleware registration happens at import time regardless of route order), but keep it at the top of the file for readability — an agent editing this file later should see it immediately.
- FastAPI's `CORSMiddleware` automatically handles the browser's `OPTIONS` preflight requests — do not write a manual `@app.options(...)` handler; that would conflict with it.
- If the frontend dev server ever runs on a port not in `ALLOWED_ORIGINS`, add it to the list and restart `uvicorn` (CORS origins are read once at startup, not per-request).
- Confirm the frontend's fetch calls use the **full backend URL** (`http://localhost:8000/api/...`), not a relative path — a relative path would silently hit the frontend dev server instead of FastAPI and produce a confusing 404 that looks like a CORS issue but isn't.

---

## 7. `main.py` — Full Implementation

Build this file exactly as follows. Comments in the code explain the "why" so the structure isn't accidentally changed during future edits.

```python
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
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{UNSPLASH_API_BASE}/search/photos", headers=headers, params=params)

    if resp.status_code == 403:
        logger.warning("Unsplash rate limit hit: %s", resp.headers.get("X-Ratelimit-Remaining"))
        raise HTTPException(status_code=503, detail="Image service is temporarily busy. Please try again shortly.")
    resp.raise_for_status()

    data = resp.json()
    results = data.get("results", [])
    if not results:
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
    session_id = str(uuid.uuid4())
    category = CATEGORY_ORDER[0]
    cursor = {"hobby_idx": 0, "place_idx": 0}

    query = build_query_for_category(profile, category, cursor)
    photo = await fetch_unsplash_photo(query)
    await trigger_download_event(photo)

    SESSIONS[session_id] = {
        "profile": profile,
        "cursor": cursor,
        "category_index": 0,   # index into CATEGORY_ORDER
        "step": 1,
    }

    caption = build_caption(category, query)
    return photo_to_response(photo, category, caption, session_id, step=1, is_last=False)

@app.post("/api/session/{session_id}/next", response_model=ImageResponse)
async def next_image(session_id: str, payload: DescriptionPayload):
    session = SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Start a new session.")

    # (Optional) store the patient's description for this step for later review/analysis.
    session.setdefault("descriptions", []).append(payload.description)

    session["category_index"] = (session["category_index"] + 1) % len(CATEGORY_ORDER)
    category = CATEGORY_ORDER[session["category_index"]]
    session["step"] += 1

    query = build_query_for_category(session["profile"], category, session["cursor"])
    photo = await fetch_unsplash_photo(query)
    await trigger_download_event(photo)

    caption = build_caption(category, query)
    # "is_last_in_cycle" is a soft signal the frontend can use to show
    # "Finish Session" instead of "See another memory" after a full loop —
    # adjust MAX_STEPS to whatever session length the frontend expects.
    MAX_STEPS = 8
    is_last = session["step"] >= MAX_STEPS

    return photo_to_response(photo, category, caption, session_id, step=session["step"], is_last=is_last)

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
```

---

## 8. API Contract (give this to whoever owns the frontend fetch calls)

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/api/session/start` | `PatientProfile` JSON (see below) | `ImageResponse` — first image (hobby category) |
| `POST` | `/api/session/{session_id}/next` | `{ "description": "<patient's typed answer>" }` | `ImageResponse` — next image, next category |
| `GET` | `/api/session/{session_id}/current` | — | debug info only |
| `GET` | `/api/health` | — | `{ "status": "ok" }` — use this first to confirm CORS works before wiring real calls |

**`PatientProfile` request body shape** (matches the existing onboarding form fields exactly — do not rename these keys without also updating the frontend's payload):

```json
{
  "full_name": "string",
  "age": 0,
  "hobbies": ["string", "string"],
  "past_activities": "string",
  "favorite_places": ["string", "string"],
  "life_milestones": "string"
}
```

**`ImageResponse` shape returned by both `/start` and `/next`:**

```json
{
  "session_id": "uuid-string",
  "image_url": "https://images.unsplash.com/...",
  "photographer_name": "Jane Doe",
  "photographer_profile_url": "https://unsplash.com/@janedoe?utm_source=sereenify&utm_medium=referral",
  "unsplash_link": "https://unsplash.com/?utm_source=sereenify&utm_medium=referral",
  "category": "hobby",
  "caption": "Do you remember spending time on painting? What comes to mind when you see this?",
  "step": 1,
  "is_last_in_cycle": false
}
```

**Frontend wiring note:** the existing `ImageCard` component already renders an image + caption, and the existing `NextImageControl` ("arrow-arrow" button) already exists in the UI. Only their data source changes: instead of the static mock JSON described in the frontend LLD's `mockImageService.js`, point those same call sites at `POST http://localhost:8000/api/session/start` and `POST http://localhost:8000/api/session/{session_id}/next`. Do not change any component structure, styling, or props shape beyond what's needed to consume this response shape — map `image_url` → the existing `src` prop and `caption` → the existing `caption` prop.

**Attribution requirement (do not drop this from the UI):** Unsplash's API guidelines require visible credit to the photographer and to Unsplash whenever a photo is displayed. Render `photographer_name` (linking to `photographer_profile_url`) and a link to `unsplash_link` somewhere near the image — even a small caption line under the image card is sufficient (e.g. "Photo by {photographer_name} on Unsplash").

---

## 9. Running It Locally — Step by Step

1. `cd backend`
2. `pip install -r requirements.txt`
3. Confirm `.env` has both keys set (Section 3).
4. Start the server: `uvicorn main:app --reload --port 8000`
5. In a browser, visit `http://localhost:8000/api/health` — you should see `{"status":"ok"}`. If this fails, the problem is in your Python setup, not CORS — fix this first.
6. Start the frontend as usual (`npm run dev` or equivalent) and confirm which port it's actually running on.
7. If the frontend port isn't already in `ALLOWED_ORIGINS` in `main.py`, add it and restart `uvicorn`.
8. From the frontend's onboarding form, submit a profile and confirm the network tab shows a successful `POST` to `/api/session/start` with no CORS error in the console.
9. Click the arrow/"next image" button and confirm a successful `POST` to `/api/session/{id}/next`.

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Browser console: `blocked by CORS policy` | Frontend origin/port not in `ALLOWED_ORIGINS`, or middleware added after routes/app misconfigured | Add the exact origin (protocol + host + port) to the list in Section 6.2 and restart `uvicorn` |
| `422 Unprocessable Entity` on `/api/session/start` | Frontend payload keys don't match `PatientProfile` field names | Match the exact JSON shape in Section 8 |
| `503` from `/api/session/.../next` | Unsplash 50-req/hour demo rate limit hit | Wait for the hourly reset, or reduce test clicks; this is expected in demo mode, not a bug |
| `404 Session not found` | `session_id` from `/start` wasn't stored/passed back correctly by the frontend | Confirm the frontend keeps `session_id` from the `/start` response and includes it in the `/next` URL |
| Images repeat identically every session | Random pick still landed on the same result, or profile field only has one item | Expected occasionally with `random.choice` over 10 results — not a bug; increase `per_page` if more variety is wanted |
| `RuntimeError: UNSPLASH_ACCESS_KEY is missing` at startup | `.env` not in the same folder as `main.py`, or `load_dotenv()` running from wrong working directory | Run `uvicorn` from inside the `backend/` folder so `.env` is found relative to the process's cwd |

---

## 11. What NOT to Do

- Do **not** rebuild, restyle, or restructure the existing frontend components — this task is backend-only.
- Do **not** call the Unsplash API directly from the frontend/browser — always route through this FastAPI backend (keeps keys secret, avoids a second CORS problem with `api.unsplash.com` itself).
- Do **not** use the Secret Key anywhere in request headers — it isn't needed for these endpoints.
- Do **not** set `allow_origins=["*"]` together with `allow_credentials=True` — pick one pattern from Section 6.3 and stay consistent.
- Do **not** skip the download-trigger call (Section 5, step 5) — it's a compliance requirement of the Unsplash API Guidelines, not an optional nicety.
