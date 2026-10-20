import asyncio
import logging
import os
import httpx

logger = logging.getLogger("sereenify-scoring.tinyfish")

SEARCH_URL = "https://api.search.tinyfish.ai"
FETCH_URL = "https://api.fetch.tinyfish.ai"


class TinyFishError(RuntimeError):
    pass


def _headers() -> dict:
    key = os.getenv("TINYFISH_API_KEY")
    if not key:
        raise TinyFishError("TINYFISH_API_KEY is not set in .env")
    return {"X-API-Key": key}


async def _request(method: str, url: str, **kw) -> dict:
    for attempt in range(4):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                r = await client.request(method, url, headers=_headers(), **kw)
            if r.status_code == 200:
                return r.json()
            if r.status_code in (429, 502, 503, 504):
                retry_after = float(r.headers.get("Retry-After", 2 ** attempt))
                wait_time = min(retry_after, 15.0)
                logger.warning("TinyFish transient status %d, backing off %.1fs", r.status_code, wait_time)
                await asyncio.sleep(wait_time)
                continue
            raise TinyFishError(f"TinyFish {r.status_code}: {r.text[:300]}")
        except httpx.RequestError as e:
            logger.warning("TinyFish network error: %s (attempt %d/4)", e, attempt + 1)
            await asyncio.sleep(2 ** attempt)
            continue
    raise TinyFishError("TinyFish unavailable after retries")


async def search(
    query: str,
    *,
    purpose: str,
    domain_type: str = "web",
    include_domains=None,
    exclude_domains=None,
    pub_year_min=None,
) -> list:
    params = {"query": query, "purpose": purpose, "domain_type": domain_type}
    if include_domains:
        params["include_domains"] = ",".join(include_domains) if isinstance(include_domains, list) else include_domains
    if exclude_domains:
        params["exclude_domains"] = ",".join(exclude_domains) if isinstance(exclude_domains, list) else exclude_domains
    if pub_year_min and domain_type == "research_paper":
        params["pub_year_min"] = pub_year_min
    data = await _request("GET", SEARCH_URL, params=params)
    return data.get("results", [])


async def fetch(urls: list, *, purpose: str, ttl: int = 86400, image_links: bool = False) -> tuple[list, list]:
    if not urls:
        return [], []
    body = {
        "urls": urls[:10],
        "format": "markdown",
        "ttl": ttl,
        "purpose": purpose,
    }
    if image_links:
        body["image_links"] = True
    data = await _request("POST", FETCH_URL, json=body)
    return data.get("results", []), data.get("errors", [])
