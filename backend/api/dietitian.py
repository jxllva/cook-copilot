"""
POST /api/dietitian — Run the Dietitian AI stage.
Input:  { prompt, profile }
Output: DietitianResponse
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from posthog import new_context, identify_context, set_context_session

from schemas.pipeline import DietitianRequest, DietitianResponse
from db.repositories.settings import get_settings_record
from core.posthog_client import get_posthog
import services.dietitian as dietitian_service

router = APIRouter()


@router.post("/api/dietitian", response_model=DietitianResponse)
async def run_dietitian(
    req: DietitianRequest,
    x_posthog_distinct_id: Optional[str] = Header(None),
    x_posthog_session_id: Optional[str] = Header(None),
) -> DietitianResponse:
    settings = get_settings_record()
    posthog = get_posthog()
    with new_context():
        if x_posthog_distinct_id:
            identify_context(x_posthog_distinct_id)
        if x_posthog_session_id:
            set_context_session(x_posthog_session_id)
        try:
            result = dietitian_service.run(
                profile=req.profile,
                meal_type=req.meal_type,
                use_rag=settings.use_rag,
                model=settings.llm_model,
            )
            posthog.capture(
                "nutrition calculated",
                properties={
                    "meal_type": req.meal_type,
                    "allergen_count": len(result.get("allergens", [])),
                    "has_medical_conditions": bool(req.profile.medicalConditions),
                    "has_dietary_preferences": bool(req.profile.dietaryPreferences),
                    "use_rag": settings.use_rag,
                    "llm_model": settings.llm_model,
                },
            )
            return DietitianResponse(**result)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) from e
