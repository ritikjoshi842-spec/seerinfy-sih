import asyncio
import logging
import os
from typing import Type, TypeVar, Optional, Dict, Any
from groq import AsyncGroq, RateLimitError, APIConnectionError, BadRequestError
from pydantic import BaseModel

from .config import GROQ_MODEL

logger = logging.getLogger("sereenify-scoring.groq")

T = TypeVar("T", bound=BaseModel)
_client: Optional[AsyncGroq] = None
_gate = asyncio.Semaphore(2)  # serialize slightly to stay within 8K TPM on free tier

# Track worst rate limit stats observed
RATE_LIMIT_STATS: Dict[str, Any] = {
    "min_remaining_tokens": None,
    "min_remaining_requests": None,
    "last_tokens_remaining": None,
    "last_requests_remaining": None,
}


def client() -> AsyncGroq:
    global _client
    if _client is None:
        key = os.getenv("GROQ_API_KEY")
        if not key:
            raise RuntimeError("GROQ_API_KEY is not set in .env")
        _client = AsyncGroq(api_key=key)
    return _client


def _update_rate_limit_stats(name: str, headers: Any):
    rem_tokens = headers.get("x-ratelimit-remaining-tokens")
    rem_reqs = headers.get("x-ratelimit-remaining-requests")
    logger.info("Groq Agent '%s': remaining tokens=%s, remaining reqs=%s", name, rem_tokens, rem_reqs)

    if rem_tokens is not None:
        try:
            tokens_val = int(rem_tokens)
            RATE_LIMIT_STATS["last_tokens_remaining"] = tokens_val
            if (
                RATE_LIMIT_STATS["min_remaining_tokens"] is None
                or tokens_val < RATE_LIMIT_STATS["min_remaining_tokens"]
            ):
                RATE_LIMIT_STATS["min_remaining_tokens"] = tokens_val
        except (ValueError, TypeError):
            pass

    if rem_reqs is not None:
        try:
            reqs_val = int(rem_reqs)
            RATE_LIMIT_STATS["last_requests_remaining"] = reqs_val
            if (
                RATE_LIMIT_STATS["min_remaining_requests"] is None
                or reqs_val < RATE_LIMIT_STATS["min_remaining_requests"]
            ):
                RATE_LIMIT_STATS["min_remaining_requests"] = reqs_val
        except (ValueError, TypeError):
            pass


async def run_agent(
    *,
    name: str,
    system_prompt: str,
    user_payload: str,
    schema: Type[T],
    effort: str = "low",
    max_tokens: int = 500,
) -> T:
    async with _gate:
        strict_mode = True
        schema_retry_done = False
        curr_max_tokens = max_tokens

        for attempt in range(4):
            try:
                raw_resp = await client().chat.completions.with_raw_response.create(
                    model=GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_payload},
                    ],
                    temperature=0.3,
                    seed=7,
                    reasoning_effort=effort,
                    include_reasoning=False,
                    max_completion_tokens=curr_max_tokens,
                    response_format={
                        "type": "json_schema",
                        "json_schema": {
                            "name": name,
                            "strict": strict_mode,
                            "schema": schema.model_json_schema(),
                        },
                    },
                )

                _update_rate_limit_stats(name, raw_resp.headers)
                resp = await raw_resp.parse()
                choice = resp.choices[0]

                if choice.finish_reason == "length":
                    logger.warning("Agent '%s' hit length limit (%d tokens), increasing slightly", name, curr_max_tokens)
                    curr_max_tokens = min(curr_max_tokens + 150, 700)
                    continue

                content = choice.message.content or ""
                return schema.model_validate_json(content)

            except RateLimitError as e:
                wait = float(e.response.headers.get("retry-after", 2 ** attempt))
                capped_wait = min(wait, 20.0)
                logger.warning("Agent '%s' rate limited (429), waiting %.1fs (attempt %d/4)", name, capped_wait, attempt + 1)
                await asyncio.sleep(capped_wait)
                continue

            except APIConnectionError as e:
                logger.warning("Agent '%s' connection error (%s), waiting %ds", name, e, 2 ** attempt)
                await asyncio.sleep(2 ** attempt)
                continue

            except BadRequestError as e:
                err_msg = str(e).lower()
                # If output was truncated due to max_completion_tokens, add small budget and retry
                if "max completion tokens" in err_msg or "truncated" in err_msg or "token" in err_msg:
                    logger.warning("Agent '%s' truncated by token limit. Increasing budget to %d and retrying...", name, curr_max_tokens + 150)
                    curr_max_tokens = min(curr_max_tokens + 150, 700)
                    continue

                # On a schema format error, retry once with "strict": False
                if not schema_retry_done and "schema" in err_msg:
                    logger.warning("Agent '%s' schema error (%s). Retrying with strict=False", name, e)
                    strict_mode = False
                    schema_retry_done = True
                    system_prompt += "\nReturn only JSON matching this schema."
                    continue
                logger.error("Agent '%s' BadRequestError: %s", name, e)
                raise

            except Exception as e:
                logger.error("Agent '%s' unexpected error on attempt %d: %s", name, attempt + 1, e)
                if attempt == 3:
                    raise

        raise RuntimeError(f"Agent '{name}' failed after retries")
