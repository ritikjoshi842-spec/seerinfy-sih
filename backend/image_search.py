import asyncio
import logging
import re
import os
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse
import httpx

from scoring.tinyfish_client import search as tinyfish_search, fetch as tinyfish_fetch

logger = logging.getLogger("sereenify.image_search")

# Noise patterns to exclude candidate URLs that are definitely not main content images
DISALLOWED_PATTERNS = [
    r"\.svg(\?|$)",
    r"\.ico(\?|$)",
    r"\.gif(\?|$)",
    r"logo",
    r"favicon",
    r"avatar",
    r"profile[-_]?photo",
    r"pixel",
    r"icon[-_]?",
    r"badge",
    r"button",
    r"1x1",
    r"spacer",
    r"spinner",
    r"loader",
    r"tracker",
    r"analytics",
    r"sprite",
    r"adservice",
    r"doubleclick",
    r"data:image",
]
DISALLOWED_REGEX = re.compile("|".join(DISALLOWED_PATTERNS), re.IGNORECASE)

# Image formats and CDNs we recognize as likely photographic
PREFERRED_PATTERNS = [
    r"\.jpe?g(\?|$)",
    r"\.png(\?|$)",
    r"\.webp(\?|$)",
    r"images\.unsplash\.com",
    r"media\.istockphoto\.com",
    r"upload\.wikimedia\.org",
    r"images\.pexels\.com",
    r"live\.staticflickr\.com",
    r"cdn",
    r"photos?",
]
PREFERRED_REGEX = re.compile("|".join(PREFERRED_PATTERNS), re.IGNORECASE)


async def validate_image_url(url: str, timeout: float = 3.0) -> bool:
    """Verifies that the URL is a reachable, public direct image asset."""
    if not url or not (url.startswith("http://") or url.startswith("https://")):
        return False

    if DISALLOWED_REGEX.search(url):
        return False

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    }

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            # 1. Try HEAD first for minimal bandwidth
            try:
                resp = await client.head(url, headers=headers)
            except httpx.HTTPError:
                resp = None

            # 2. Some servers (like Flickr/Wikimedia or CDNs) reject HEAD (405 or 403), fallback to GET with Range
            if resp is None or resp.status_code in (403, 405):
                get_headers = dict(headers)
                get_headers["Range"] = "bytes=0-2048"
                resp = await client.get(url, headers=get_headers)

            if resp.status_code not in (200, 206):
                return False

            content_type = resp.headers.get("Content-Type", "").lower()
            if not content_type.startswith("image/"):
                return False
            if "svg" in content_type or "xml" in content_type or "html" in content_type:
                return False

            # If Content-Length is provided, ensure it's not a microscopic 1x1 tracker
            content_length = resp.headers.get("Content-Length")
            if content_length:
                try:
                    if int(content_length) < 8192:  # Less than 8 KB is usually a thumbnail or icon
                        return False
                except (ValueError, TypeError):
                    pass

            return True
    except Exception as e:
        logger.debug("Validation failed for image url %s: %s", url, e)
        return False


def clean_site_name(url: str) -> str:
    """Extract a human-readable publisher name from a domain URL."""
    try:
        domain = urlparse(url).netloc
        domain = re.sub(r"^www\.", "", domain)
        return domain.capitalize() if domain else "Web Photography Archive"
    except Exception:
        return "Web Photography Archive"


async def search_tinyfish(query: str, category: str, timeout: float = 20.0) -> Optional[Dict[str, Any]]:
    """Primary image search using TinyFish Search + Fetch with image_links=True.
    
    1. Formulates photographic reminiscence search query
    2. Uses TinyFish Search API
    3. Fetches top resulting web pages with image_links: true
    4. Validates extracted image URLs with HTTP check
    5. Returns dict with direct image URL and source attribution
    """
    clean_query = query.strip() if query else "cherished memory"
    if "vintage" in clean_query.lower() or "photo" in clean_query.lower():
        search_query = clean_query
    else:
        search_query = f"{clean_query} vintage photo"

    logger.info("Attempting primary image search via TinyFish for portfolio query: '%s'", search_query)

    try:
        # Step 1: TinyFish Search
        search_results = await asyncio.wait_for(
            tinyfish_search(
                query=search_query,
                purpose=f"Find high quality nostalgic vintage photo of {clean_query}",
                domain_type="web",
                exclude_domains=[
                    "quora.com",
                    "pinterest.com",
                    "facebook.com",
                    "tiktok.com",
                    "instagram.com",
                    "stock.adobe.com",
                    "shutterstock.com",
                ],
            ),
            timeout=5.0,
        )

        if not search_results:
            logger.info("TinyFish search returned 0 results for '%s'", search_query)
            return None

        # Filter search results for valid webpages
        candidate_pages = []
        for r in search_results:
            page_url = r.get("url")
            if page_url and page_url.startswith("http"):
                candidate_pages.append(r)

        if not candidate_pages:
            logger.info("No usable web page URLs found in TinyFish search results")
            return None

        # Step 2: TinyFish Fetch with image_links=True (top 1 page for fast response)
        top_urls = [candidate_pages[0]["url"]]
        fetch_results, _ = await asyncio.wait_for(
            tinyfish_fetch(
                top_urls,
                purpose="Extract photography image links for reminiscence therapy",
                image_links=True,
            ),
            timeout=10.0,
        )

        if not fetch_results:
            logger.info("TinyFish fetch returned no page data for URLs: %s", top_urls)
            return None

        # Step 3: Extract and rank candidate image links
        candidate_images: List[tuple[str, str, str]] = []  # (img_url, page_url, page_title)

        for page in fetch_results:
            page_url = page.get("url", "")
            page_title = page.get("title", "") or clean_site_name(page_url)
            img_links = page.get("image_links", [])

            for img_url in img_links:
                if not isinstance(img_url, str) or not img_url.startswith("http"):
                    continue
                if DISALLOWED_REGEX.search(img_url):
                    continue
                candidate_images.append((img_url, page_url, page_title))

        if not candidate_images:
            logger.info("TinyFish fetch returned pages, but no direct image links were discovered")
            return None

        # Prioritize images matching common photo formats or CDNs
        sorted_candidates = sorted(
            candidate_images,
            key=lambda item: 0 if PREFERRED_REGEX.search(item[0]) else 1,
        )

        # Step 4: Validate candidate URLs asynchronously (check first 6)
        for img_url, page_url, page_title in sorted_candidates[:6]:
            is_valid = await validate_image_url(img_url, timeout=3.0)
            if is_valid:
                logger.info("TinyFish successfully found valid image: %s (source: %s)", img_url, page_url)
                return {
                    "image_url": img_url,
                    "photographer_name": page_title,
                    "photographer_profile_url": page_url,
                    "unsplash_link": page_url,
                    "alt_description": f"{query} reminiscence photo",
                    "provider": "tinyfish",
                }

        logger.info("All TinyFish extracted candidate images failed HTTP accessibility validation")
        return None

    except asyncio.TimeoutError:
        logger.warning("TinyFish image search timed out after %.1fs", timeout)
        return None
    except Exception as e:
        logger.warning("TinyFish image search error: %s", e)
        return None


async def search_image_with_fallback(
    query: str,
    category: str,
    fetch_unsplash_fn,
    trigger_download_fn,
) -> Dict[str, Any]:
    """Orchestrates image search:
    1. Primary: TinyFish web image extraction and validation
    2. Fallback 1: Unsplash API
    3. Fallback 2: Local offline archive asset
    """
    # 1. Primary: Try TinyFish
    tinyfish_result = await search_tinyfish(query, category)
    if tinyfish_result:
        # Pre-fetch an Unsplash fallback photo info in the background or provide Unsplash fallback metadata
        # so if the browser fails to render the image, the frontend has an immediate fallback ready
        fallback_photo = None
        try:
            # Quick attempt to get fallback photo
            fallback_photo = await fetch_unsplash_fn(query)
            if fallback_photo and trigger_download_fn:
                asyncio.create_task(trigger_download_fn(fallback_photo))
        except Exception as e:
            logger.debug("Could not pre-fetch Unsplash fallback: %s", e)

        if fallback_photo:
            tinyfish_result["fallback_image_url"] = fallback_photo["urls"]["regular"]
            tinyfish_result["fallback_photographer_name"] = fallback_photo["user"]["name"]
            tinyfish_result["fallback_photographer_url"] = (
                f'{fallback_photo["user"]["links"]["html"]}?utm_source=sereenify&utm_medium=referral'
            )
            tinyfish_result["fallback_unsplash_link"] = (
                "https://unsplash.com/?utm_source=sereenify&utm_medium=referral"
            )

        return tinyfish_result

    # 2. Fallback 1: Unsplash API
    logger.info("Invoking Unsplash fallback for query: '%s'", query)
    try:
        photo = await fetch_unsplash_fn(query)
        if trigger_download_fn:
            await trigger_download_fn(photo)

        return {
            "image_url": photo["urls"]["regular"],
            "photographer_name": photo["user"]["name"],
            "photographer_profile_url": f'{photo["user"]["links"]["html"]}?utm_source=sereenify&utm_medium=referral',
            "unsplash_link": "https://unsplash.com/?utm_source=sereenify&utm_medium=referral",
            "alt_description": photo.get("alt_description") or photo.get("description") or f"{query} photo",
            "provider": "unsplash",
            "fallback_image_url": None,
        }
    except Exception as e:
        logger.warning("Unsplash API fallback failed (%s). Triggering offline archive fallback.", e)

    # 3. Fallback 2: Local offline archive asset
    return {
        "image_url": "/assets/game-visual-match.jpg",
        "photographer_name": "Serenify Memory Archive",
        "photographer_profile_url": "",
        "unsplash_link": "",
        "alt_description": "Serenify vintage archive memory",
        "provider": "archive",
        "fallback_image_url": None,
    }
