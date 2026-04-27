"""
Dietitian service — translates the new simplified API input format into
the requirement dict expected by the existing dietitian_agent.propose() function.
"""
from __future__ import annotations

import sys
import os
import json
from typing import Any, Dict

# Ensure parent (backend/) is on the path so legacy agent modules can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from schemas.profiles import UserProfileCreate


# ── Activity level mapping ────────────────────────────────────────────────────
# New frontend values → old dietitian_agent ACTIVITY_FACTORS keys

_ACTIVITY_MAP: Dict[str, str] = {
    "sedentary":   "ambulatory_light",  # 1.2 — closest to sedentary
    "light":       "ambulatory_light",  # 1.2
    "moderate":    "low",               # 1.3
    "active":      "active",            # 1.5
    "very_active": "very_active",       # 1.725
}


def _build_requirement(profile: UserProfileCreate, meal_type: str) -> Dict[str, Any]:
    """
    Convert the new simplified UserProfile into the legacy 'requirement'
    dict expected by dietitian_agent._run_hybrid_dietitian().
    """
    # Map new activity level strings to old ones
    old_activity = _ACTIVITY_MAP.get(profile.activityLevel, "low")

    # Combine medical conditions into a single illness string (legacy format)
    conditions = [c for c in profile.medicalConditions if c != "none"]
    illness_str = ", ".join(conditions) if conditions else "none"

    # Determine weight goal key (same values — new frontend matches legacy)
    weight_goal = profile.weightGoal  # "maintain" | "lose" | "gain"

    # Build allergens list for constraints
    allergens = list(profile.allergies)
    if profile.allergyOther:
        allergens.append(profile.allergyOther)

    return {
        "target_user": "Adult-Female" if profile.sex == "female" else "Adult-Male",
        "meal_type": meal_type,
        "user_profile": {
            # New field name → old field name mapping
            "sex": profile.sex if profile.sex != "other" else "female",
            "age_years": profile.age if profile.age > 0 else None,
            "weight_kg": profile.weightKg if profile.weightKg > 0 else None,
            "height_cm": profile.heightCm if profile.heightCm > 0 else None,
            "activity_level": old_activity,
            "illness_condition": illness_str,
            "weight_goal": weight_goal,
        },
        "constraints": {
            "allergens": allergens,
            "constraints_text": profile.dietaryPreferences,
        },
        "nutrition": {},
    }


def refine(current: Dict[str, Any], refinement: str, model: str = "gemini-3.1-flash-lite-preview") -> Dict[str, Any]:
    """
    Adjust existing nutrition targets based on free-text user refinement.

    Uses Gemini to parse the request and produce updated targets while keeping
    other fields (allergens, meal_type, etc.) from the original response.
    """
    from llm.gemini_provider import GeminiProvider

    system = (
        "You are a clinical dietitian assistant. "
        "You will receive current nutrition targets (as JSON) and a user refinement request. "
        "Return ONLY a JSON object with the same structure as `nutrition_targets` in the input, "
        "updated to reflect the user's request. "
        "Keep macro_percent values summing to 100. Keep kcal and sugar_g as {min, max} objects. "
        "Do not add or remove keys."
    )

    nt_json = json.dumps(current.get("nutrition_targets", {}), indent=2)
    user_msg = (
        f"Current nutrition targets:\n{nt_json}\n\n"
        f"User request: {refinement}\n\n"
        "Return the updated nutrition_targets JSON object only."
    )

    provider = GeminiProvider()
    raw = provider.chat(
        model=model,
        system=system,
        messages=[{"role": "user", "content": user_msg}],
        temperature=0.3,
    )

    # Strip markdown code fences if present
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    updated_nt = json.loads(text)

    return {
        **current,
        "nutrition_targets": updated_nt,
    }


def run(profile: UserProfileCreate, meal_type: str = "snack", use_rag: bool = True, model: str = "gemini-3.1-flash-lite-preview") -> Dict[str, Any]:
    """
    Run the dietitian pipeline for the given profile + meal_type.

    Args:
        meal_type: Pre-parsed by /api/parse. Defaults to "snack" if not provided.
    Returns:
        Full dietitian output dict (DietitianResponse).
    """
    import dietitian_agent

    requirement = _build_requirement(profile, meal_type=meal_type or "snack")
    kb_path = "knowledgebases/nutrition/dietitian_kb.md"
    result = dietitian_agent.propose(requirement, use_kb=use_rag, kb_path=kb_path, model=model)
    result.setdefault("meal_type", meal_type or "snack")
    return result
