"""
POST /api/chef — Run the Chef AI stage.
Input:  { nutrition_targets, allergens, shape, meal_type, requested_ingredients, requested_menu, ... }
Output: ChefResponse
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from posthog import new_context, identify_context, set_context_session

from schemas.pipeline import ChefRequest, ChefResponse
from db.repositories.settings import get_settings_record
from core.posthog_client import get_posthog
import services.chef as chef_service

router = APIRouter()


@router.post("/api/chef", response_model=ChefResponse)
async def run_chef(
    req: ChefRequest,
    x_posthog_distinct_id: Optional[str] = Header(None),
    x_posthog_session_id: Optional[str] = Header(None),
) -> ChefResponse:
    settings = get_settings_record()
    posthog = get_posthog()
    with new_context():
        if x_posthog_distinct_id:
            identify_context(x_posthog_distinct_id)
        if x_posthog_session_id:
            set_context_session(x_posthog_session_id)
        try:
            result = chef_service.run(
                nutrition_targets=req.nutrition_targets,
                allergens=req.allergens,
                age=req.age,
                sex=req.sex,
                dietary_preferences=req.dietary_preferences,
                medical_conditions=req.medical_conditions,
                use_rag=settings.use_rag,
                model=settings.llm_model,
                shape=req.shape,
                meal_type=req.meal_type,
                requested_ingredients=req.requested_ingredients,
                requested_menu=req.requested_menu,
            )
            posthog.capture(
                "recipe generated",
                properties={
                    "meal_type": req.meal_type,
                    "shape": req.shape,
                    "num_syringes": result.get("num_syringes", 0),
                    "allergen_count": len(req.allergens),
                    "has_requested_ingredients": bool(req.requested_ingredients),
                    "has_requested_menu": bool(req.requested_menu),
                    "use_rag": settings.use_rag,
                    "llm_model": settings.llm_model,
                    "has_validation_warnings": bool(result.get("validation_warnings")),
                },
            )
            return ChefResponse(**result)
        except Exception as e:
            posthog.capture(
                "recipe generation failed",
                properties={
                    "error_type": type(e).__name__,
                    "meal_type": req.meal_type,
                    "shape": req.shape,
                    "llm_model": settings.llm_model,
                },
            )
            raise HTTPException(status_code=500, detail=str(e)) from e
