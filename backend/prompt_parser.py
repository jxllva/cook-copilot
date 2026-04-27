"""
Prompt Parser — extract structured intent from a user's food request prompt.

parse() returns a ParsedPrompt with:
  - meal_type  → passed to the Dietitian
  - shape      → passed to the Chef (3D print silhouette)
  - ingredients → passed to the Chef (user-requested flavors)
  - menu       → passed to the Chef (requested dish/menu name)
"""
from __future__ import annotations

from typing import List, Literal
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv


load_dotenv()
_client = genai.Client()


class ParsedPrompt(BaseModel):
    meal_type: Literal["snack", "meal-light", "meal-regular"] = Field(
        description=(
            "Classify the eating occasion: "
            "'snack' for small bites/snacks/treats, "
            "'meal-light' for light meals, "
            "'meal-regular' for normal breakfast/lunch/dinner. "
            "Default to 'snack' for single printed food items."
        )
    )
    shape: str = Field(
        description=(
            "The shape or character to 3D-print as food. "
            "Extract an explicit shape name (e.g. 'star', 'rabbit', 'heart', 'dinosaur', 'flower'). "
            "Use 'circle' as default when no shape is mentioned."
        )
    )
    ingredients: List[str] = Field(
        default_factory=list,
        description=(
            "Food ingredients or flavors explicitly mentioned by the user "
            "(e.g. ['banana', 'cream cheese', 'sweet potato']). Not menu name."
            "Return an empty list if no specific ingredients are mentioned."
        ),
    )
    menu: str = Field(
        default="",
        description=(
            "The dish or menu name explicitly requested by the user "
            "(e.g. 'cheesecake', 'banana pudding', 'hummus'). "
            "Return empty string if no specific menu is mentioned."
        ),
    )


_SYSTEM_PROMPT = """\
You are a parser for a food 3D printing assistant (CookCopilot).
Extract structured information from the user's food request.

Rules:
- meal_type: 'snack' for small items, treats, bites; 'meal-regular' for standard meals.
- shape: any object/animal/character to print. Default to 'circle' if unclear.
- ingredients: only ingredients the user explicitly requests. Empty list otherwise.
- menu: dish or menu name the user explicitly requests. Empty string otherwise.
Keep shape values short (1-3 words, lowercase)."""


def parse(prompt: str, model: str = "gemini-3.1-flash-lite-preview") -> ParsedPrompt:
    """
    Parse a user prompt and return structured fields.

    Returns ParsedPrompt with meal_type, shape, and ingredients.
    Falls back to safe defaults on any error.
    """
    try:
        response = _client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=_SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=ParsedPrompt,
            ),
        )
        result = response.parsed
        if result is None:
            raise ValueError("Empty response from parser LLM")
        return result
    except Exception as e:
        print(f"[PromptParser] Failed, using defaults: {e}")
        return ParsedPrompt(meal_type="snack", shape="circle", ingredients=[])
