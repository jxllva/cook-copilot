<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the CookPilot FastAPI backend. Here is a summary of all changes made:

- **`backend/core/config.py`** — Added `posthog_api_key` and `posthog_host` fields to the `Settings` class, loaded from environment variables.
- **`backend/core/posthog_client.py`** *(new file)* — Singleton PostHog client initialized with `enable_exception_autocapture=True`. Registered with `atexit` to flush events on shutdown. Exposed via `get_posthog()` and `init_posthog()`.
- **`backend/main.py`** — Calls `init_posthog()` in the existing startup event handler.
- **`backend/requirements.txt`** — Added `posthog>=3.0.0`.
- **`backend/.env`** — Added `POSTHOG_API_KEY` and `POSTHOG_HOST`.
- **`backend/api/parse.py`** — Captures `prompt parsed` and `prompt parse failed` with context/session headers.
- **`backend/api/dietitian.py`** — Captures `nutrition calculated` with context/session headers.
- **`backend/api/chef.py`** — Captures `recipe generated` and `recipe generation failed` with context/session headers.
- **`backend/api/engineer.py`** — Captures `gcode generated`, `gcode regenerated`, and `gcode generation failed` with context/session headers.
- **`backend/api/profiles.py`** — Captures `profile created` and `profile deleted` with context/session headers.
- **`backend/api/settings.py`** — Captures `settings updated` with context/session headers.
- **`backend/api/batch.py`** — Captures `batch run started` and `batch run completed` (on background task finish).

All route handlers accept optional `X-PostHog-Distinct-ID` and `X-PostHog-Session-ID` headers to correlate server-side events with frontend sessions. Each handler uses `new_context()` + `identify_context()` for proper user association.

| Event | Description | File |
|---|---|---|
| `prompt parsed` | User submits a food request prompt that is successfully parsed into meal type, shape, ingredients, and menu. | `backend/api/parse.py` |
| `prompt parse failed` | User's food request prompt failed to parse due to an error. | `backend/api/parse.py` |
| `nutrition calculated` | Dietitian AI successfully computed nutrition targets and allergen info for a user profile. | `backend/api/dietitian.py` |
| `recipe generated` | Chef AI successfully generated syringe-based food paste recipes for the 3D printer. | `backend/api/chef.py` |
| `recipe generation failed` | Chef AI failed to generate recipes due to an error. | `backend/api/chef.py` |
| `gcode generated` | Engineer AI successfully generated GCode for the food 3D printer from recipe data. | `backend/api/engineer.py` |
| `gcode regenerated` | User triggered GCode regeneration with updated extrusion multiplier (EM) and layer height (LH) values. | `backend/api/engineer.py` |
| `gcode generation failed` | Engineer AI failed to generate or regenerate GCode due to an error. | `backend/api/engineer.py` |
| `profile created` | A new user profile was created. | `backend/api/profiles.py` |
| `profile deleted` | A user profile was deleted. | `backend/api/profiles.py` |
| `settings updated` | App settings (LLM model, RAG toggle, etc.) were updated by the user. | `backend/api/settings.py` |
| `batch run started` | A batch evaluation job was started, running the pipeline N times. | `backend/api/batch.py` |
| `batch run completed` | A batch evaluation job finished with a final status of done or error. | `backend/api/batch.py` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/393349/dashboard/1499222
- **Full pipeline completion funnel** (prompt → nutrition → recipe → GCode): https://us.posthog.com/project/393349/insights/RHBESjNb
- **Pipeline error rate over time** (parse, recipe, GCode failures per day): https://us.posthog.com/project/393349/insights/ofyZlFAk
- **Recipe generation volume** (daily area chart): https://us.posthog.com/project/393349/insights/gL9mcSBB
- **GCode print-ready rate** (prompts parsed vs GCode generated, weekly): https://us.posthog.com/project/393349/insights/cS7vMvpp
- **Profile creation and GCode regeneration activity** (new users + power-user fine-tuning): https://us.posthog.com/project/393349/insights/eqXuREs6

### Frontend correlation

To correlate frontend and backend events, pass these headers from your frontend fetch calls:

```js
import posthog from 'posthog-js'

fetch('/api/chef', {
  method: 'POST',
  headers: {
    'X-PostHog-Distinct-ID': posthog.get_distinct_id(),
    'X-PostHog-Session-ID': posthog.get_session_id(),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
})
```

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
