"""
PostHog analytics client — initialized once on startup.
Import `posthog_client` from this module to capture events.
"""
from __future__ import annotations

import atexit

from posthog import Posthog

from core.config import get_settings

_client: Posthog | None = None


def get_posthog() -> Posthog:
    """Return the initialized PostHog client (lazy init fallback)."""
    global _client
    if _client is None:
        init_posthog()
    return _client  # type: ignore[return-value]


def init_posthog() -> None:
    """Initialize the PostHog client. Called once during app startup."""
    global _client
    settings = get_settings()
    _client = Posthog(
        settings.posthog_api_key,
        host=settings.posthog_host,
        enable_exception_autocapture=True,
    )
    atexit.register(_client.shutdown)
