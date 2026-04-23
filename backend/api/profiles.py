"""
CRUD endpoints for user profiles.
GET    /api/profiles
POST   /api/profiles
PUT    /api/profiles/{id}
DELETE /api/profiles/{id}
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional

from posthog import new_context, identify_context, set_context_session

from schemas.profiles import UserProfileCreate, UserProfileOut
from db.repositories import profiles as profiles_repo
from core.posthog_client import get_posthog

router = APIRouter()


@router.get("/api/profiles", response_model=List[UserProfileOut])
async def list_profiles() -> List[UserProfileOut]:
    return profiles_repo.list_profiles()


@router.post("/api/profiles", response_model=UserProfileOut, status_code=201)
async def create_profile(
    data: UserProfileCreate,
    x_posthog_distinct_id: Optional[str] = Header(None),
    x_posthog_session_id: Optional[str] = Header(None),
) -> UserProfileOut:
    posthog = get_posthog()
    with new_context():
        if x_posthog_distinct_id:
            identify_context(x_posthog_distinct_id)
        if x_posthog_session_id:
            set_context_session(x_posthog_session_id)
        profile = profiles_repo.create_profile(data)
        posthog.capture(
            "profile created",
            properties={
                "activity_level": data.activityLevel,
                "weight_goal": data.weightGoal,
                "has_allergies": bool(data.allergies),
                "has_medical_conditions": bool(data.medicalConditions),
                "has_dietary_preferences": bool(data.dietaryPreferences),
            },
        )
        return profile


@router.put("/api/profiles/{profile_id}", response_model=UserProfileOut)
async def update_profile(profile_id: str, data: UserProfileCreate) -> UserProfileOut:
    updated = profiles_repo.update_profile(profile_id, data)
    if updated is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return updated


@router.delete("/api/profiles/{profile_id}", status_code=204)
async def delete_profile(
    profile_id: str,
    x_posthog_distinct_id: Optional[str] = Header(None),
    x_posthog_session_id: Optional[str] = Header(None),
) -> None:
    posthog = get_posthog()
    with new_context():
        if x_posthog_distinct_id:
            identify_context(x_posthog_distinct_id)
        if x_posthog_session_id:
            set_context_session(x_posthog_session_id)
        if not profiles_repo.delete_profile(profile_id):
            raise HTTPException(status_code=404, detail="Profile not found")
        posthog.capture("profile deleted", properties={})
