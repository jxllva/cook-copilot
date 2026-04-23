"""
POST /api/engineer — Run the Engineer AI stage.
POST /api/gcode/regenerate — Regenerate GCode with updated EM/LH.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from posthog import new_context, identify_context, set_context_session

from schemas.pipeline import (
    EngineerRequest,
    EngineerResponse,
    GCodeRegenerateRequest,
    GCodeRegenerateResponse,
)
from core.posthog_client import get_posthog
import services.engineer as engineer_service

router = APIRouter()


@router.post("/api/engineer", response_model=EngineerResponse)
async def run_engineer(
    req: EngineerRequest,
    x_posthog_distinct_id: Optional[str] = Header(None),
    x_posthog_session_id: Optional[str] = Header(None),
) -> EngineerResponse:
    posthog = get_posthog()
    with new_context():
        if x_posthog_distinct_id:
            identify_context(x_posthog_distinct_id)
        if x_posthog_session_id:
            set_context_session(x_posthog_session_id)
        try:
            result = engineer_service.run(
                prompt=req.prompt,
                chef_output=req.recipes,
                age=req.age,
                meal_type=req.meal_type,
            )
            posthog.capture(
                "gcode generated",
                properties={
                    "meal_type": req.meal_type,
                    "pieces": result.get("pieces", 1),
                    "has_warnings": bool(result.get("warnings")),
                    "gcode_length": len(result.get("gcode", "")),
                },
            )
            return EngineerResponse(**result)
        except Exception as e:
            posthog.capture(
                "gcode generation failed",
                properties={
                    "error_type": type(e).__name__,
                    "meal_type": req.meal_type,
                },
            )
            raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/api/gcode/regenerate", response_model=GCodeRegenerateResponse)
async def regenerate_gcode(
    req: GCodeRegenerateRequest,
    x_posthog_distinct_id: Optional[str] = Header(None),
    x_posthog_session_id: Optional[str] = Header(None),
) -> GCodeRegenerateResponse:
    posthog = get_posthog()
    with new_context():
        if x_posthog_distinct_id:
            identify_context(x_posthog_distinct_id)
        if x_posthog_session_id:
            set_context_session(x_posthog_session_id)
        try:
            gcode = engineer_service.regenerate(
                syringe_recipes=[r.model_dump() if hasattr(r, "model_dump") else r for r in req.syringe_recipes],
                silhouette_b64=req.silhouette_b64,
                em_values=req.em_values,
                lh=req.lh,
            )
            posthog.capture(
                "gcode regenerated",
                properties={
                    "syringe_count": len(req.syringe_recipes),
                    "layer_height": req.lh,
                    "gcode_length": len(gcode),
                },
            )
            return GCodeRegenerateResponse(gcode=gcode)
        except Exception as e:
            posthog.capture(
                "gcode generation failed",
                properties={
                    "error_type": type(e).__name__,
                    "stage": "regenerate",
                },
            )
            raise HTTPException(status_code=500, detail=str(e)) from e
