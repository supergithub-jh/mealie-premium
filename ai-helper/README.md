# Mealie Premium AI helper

A small service that runs beside Mealie Premium and adds AI features without changing Mealie's
backend. Part of the Mealie Premium fork (see `cookbook/HANDOFF.md`, section 9).

- **v0.5.0:** AI recipe photos (generate, regenerate, revert), tagged "AI image".
- Planned: video importer, weekly Recipe of the Week, AI Recipe Finder.

## How it works

- Reached at the **same address as Mealie**, under `/ai-helper` (the reverse proxy routes that path
  to this container). Not exposed on its own.
- Every request must carry the user's Mealie login (the app's `Authorization` header or Mealie's
  `mealie.access_token` cookie); the helper confirms it with Mealie (`GET /api/users/self`).
- All changes go through Mealie's normal API **as that user**: `PUT /api/recipes/{slug}/image` for the
  photo, `PATCH /api/recipes/{slug}` for the tag, `DELETE /api/recipes/{slug}/image` to go back to no photo.
- The OpenAI key lives only here (environment variable); it never reaches the browser.
- Before a recipe's first AI photo, its original photo (or "no photo") is kept in `/data/originals`,
  so **Revert** can restore it.

## API (under `/ai-helper/api`; `/api` also works if the proxy strips the prefix)

| Method | Path | |
| --- | --- | --- |
| GET | `/health` | no login; `{ok, version}` |
| GET | `/status` | features, daily limit, images used today |
| GET | `/images/{slug}` | `{aiImage, canRevert}` |
| POST | `/images/{slug}` | make (or remake) the AI photo |
| POST | `/images/{slug}/revert` | put the original photo back, remove the tag |

## Settings (environment variables)

| Name | Default | |
| --- | --- | --- |
| `MEALIE_URL` | `http://mealie:9000` | Mealie as seen from inside Docker |
| `OPENAI_API_KEY` | (none) | required for images |
| `OPENAI_IMAGE_MODEL` | `gpt-image-2` | OpenAI image model; change here when OpenAI renames models |
| `OPENAI_IMAGE_QUALITY` | `medium` | `low`, `medium` or `high` (price rises with quality) |
| `DAILY_IMAGE_LIMIT` | `20` | images per day for the household; `0` switches images off |
| `AI_IMAGE_TAG` | `AI image` | tag put on recipes with an AI photo |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | for testing only |
| `DATA_DIR` | `/data` | mount a volume here |

## Development

```bash
cd ai-helper
python -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q
MEALIE_URL=http://localhost:9000 OPENAI_API_KEY=sk-... DATA_DIR=./data .venv/bin/uvicorn app.main:app --port 9100
```

The Nuxt dev server forwards `/ai-helper` to `AI_HELPER_URL` (default `http://localhost:9100`).

Releases: tag `ai-helper-vX.Y.Z` builds `ghcr.io/<owner>/mealie-ai-helper:vX.Y.Z`
(`.github/workflows/ai-helper-image.yml`).
