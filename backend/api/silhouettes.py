"""
POST /api/silhouettes — Generate 3 distinct shape silhouette variants.

Returns Classic / Rounded / Geometric interpretations of the requested shape,
generated concurrently via DALL-E so the caller gets all three in one round-trip.
"""
from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()

router = APIRouter()
_executor = ThreadPoolExecutor(max_workers=3)

# ── Schemas ───────────────────────────────────────────────────────────────────

class SilhouetteRequest(BaseModel):
    shape: str

class SilhouetteVariant(BaseModel):
    label: str
    description: str
    b64: Optional[str] = None

class SilhouettesResponse(BaseModel):
    variants: list[SilhouetteVariant]

# ── Variant definitions ───────────────────────────────────────────────────────

_VARIANTS = [
    {
        "label": "Classic",
        "description": "Standard form",
        "suffix": (
            "Faithful, recognizable interpretation with natural proportions. "
            "The silhouette must be a single fully-closed solid shape with no gaps, "
            "holes, or floating islands — suitable for food 3D printing as a cookie-cutter path."
        ),
    },
    {
        "label": "Rounded",
        "description": "Soft & bubbly",
        "suffix": (
            "Inflated, balloon-like version of the same subject. All curves are convex and smooth — "
            "imagine the shape gently puffed up. No sharp concavities, no thin spikes. "
            "The silhouette is a single closed solid blob, 3D-printable without supports."
        ),
    },
    {
        "label": "Geometric",
        "description": "Angular & bold",
        "suffix": (
            "Stylized polygon approximation of the shape — reduce it to its essential angles "
            "using straight edges and bold flat facets, like a low-poly design. "
            "Fully closed solid fill, no floating pieces, distinct from the classic silhouette."
        ),
    },
]

# ── Generation ────────────────────────────────────────────────────────────────

_BASE_PROMPT = (
    "Pure solid black (#000000) filled silhouette of {shape} on a pure white (#FFFFFF) background. "
    "Flat 2D, centered, no texture, no internal lines, no gradients, no shading. "
    "Single closed shape — no disconnected parts. Like a rubber stamp. {suffix}"
)

def _generate_one(shape: str, suffix: str) -> Optional[str]:
    try:
        client = OpenAI()
        prompt = _BASE_PROMPT.format(shape=shape, suffix=suffix)
        response = client.images.generate(
            model="gpt-image-1",
            prompt=prompt,
            size="1024x1024",
            quality="low",
        )
        return response.data[0].b64_json
    except Exception as e:
        print(f"[Silhouettes] Generation failed for '{shape}': {e}")
        return None


@router.post("/api/silhouettes", response_model=SilhouettesResponse)
async def generate_silhouettes(req: SilhouetteRequest) -> SilhouettesResponse:
    loop = asyncio.get_event_loop()
    tasks = [
        loop.run_in_executor(_executor, _generate_one, req.shape, v["suffix"])
        for v in _VARIANTS
    ]
    results = await asyncio.gather(*tasks)
    return SilhouettesResponse(
        variants=[
            SilhouetteVariant(label=v["label"], description=v["description"], b64=b64)
            for v, b64 in zip(_VARIANTS, results)
        ]
    )
