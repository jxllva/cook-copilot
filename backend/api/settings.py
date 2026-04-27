"""
GET  /api/settings  — Fetch current app settings
PUT  /api/settings  — Update app settings
"""
from __future__ import annotations

from fastapi import APIRouter, Header
from typing import Optional

from posthog import new_context, identify_context, set_context_session

from schemas.settings import AppSettings
from db.repositories.settings import get_settings_record, save_settings_record
from core.posthog_client import get_posthog

router = APIRouter()


@router.get("/api/settings", response_model=AppSettings)
async def get_settings() -> AppSettings:
    return get_settings_record()


@router.put("/api/settings", response_model=AppSettings)
async def update_settings(
    data: AppSettings,
    x_posthog_distinct_id: Optional[str] = Header(None),
    x_posthog_session_id: Optional[str] = Header(None),
) -> AppSettings:
    posthog = get_posthog()
    with new_context():
        if x_posthog_distinct_id:
            identify_context(x_posthog_distinct_id)
        if x_posthog_session_id:
            set_context_session(x_posthog_session_id)
        result = save_settings_record(data)
        posthog.capture(
            "settings updated",
            properties={
                "llm_model": data.llm_model,
                "use_rag": data.use_rag,
                "skip_dietitian": data.skip_dietitian,
            },
        )
        return result


@router.get("/api/chef/sections")
async def get_chef_sections() -> dict:
    """Return the default content for each named chef prompt section."""
    from chef_agent import CHEF_SECTIONS
    return CHEF_SECTIONS
