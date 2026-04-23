"""
POST /api/parse — Parse the user's food request prompt.
Input:  { prompt: str }
Output: ParseResponse { meal_type, shape, ingredients, menu }
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from posthog import new_context, identify_context, set_context_session

from schemas.pipeline import ParseRequest, ParseResponse
from db.repositories.settings import get_settings_record
from core.posthog_client import get_posthog

router = APIRouter()


@router.post("/api/parse", response_model=ParseResponse)
async def parse_prompt_endpoint(
    req: ParseRequest,
    x_posthog_distinct_id: Optional[str] = Header(None),
    x_posthog_session_id: Optional[str] = Header(None),
) -> ParseResponse:
    settings = get_settings_record()
    posthog = get_posthog()
    with new_context():
        if x_posthog_distinct_id:
            identify_context(x_posthog_distinct_id)
        if x_posthog_session_id:
            set_context_session(x_posthog_session_id)
        try:
            from prompt_parser import parse
            parsed = parse(req.prompt, model=settings.llm_model)
            posthog.capture(
                "prompt parsed",
                properties={
                    "meal_type": parsed.meal_type,
                    "shape": parsed.shape,
                    "ingredient_count": len(parsed.ingredients),
                    "has_menu": bool(parsed.menu),
                    "llm_model": settings.llm_model,
                },
            )
            return ParseResponse(
                meal_type=parsed.meal_type,
                shape=parsed.shape,
                ingredients=parsed.ingredients,
                menu=parsed.menu,
            )
        except Exception as e:
            posthog.capture(
                "prompt parse failed",
                properties={
                    "error_type": type(e).__name__,
                    "llm_model": settings.llm_model,
                },
            )
            raise HTTPException(status_code=500, detail=str(e)) from e
