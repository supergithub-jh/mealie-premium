"""Mealie Premium AI helper: a small service beside Mealie. v0.5.0: AI recipe photos.

Reached at the same address as Mealie under /ai-helper (the reverse proxy routes that path here).
Every request must carry the user's Mealie login, which is confirmed with Mealie; all changes go
through Mealie's normal API as that user. The OpenAI key stays here and never reaches the browser.
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Annotated

import httpx
from fastapi import APIRouter, Cookie, Depends, FastAPI, Header, HTTPException, Request

from . import images
from .config import VERSION, Settings, get_settings
from .mealie import TOKEN_COOKIE, MealieClient, MealieError, token_from_request, with_tag, without_tag
from .store import Store

log = logging.getLogger("ai-helper")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings: Settings = app.state.settings
    app.state.http = app.state.http if getattr(app.state, "http", None) else httpx.AsyncClient(timeout=60)
    app.state.store = Store(settings.data_dir)
    app.state.locks = {}
    yield
    await app.state.http.aclose()


def create_app(settings: Settings | None = None, http: httpx.AsyncClient | None = None) -> FastAPI:
    app = FastAPI(title="Mealie Premium AI helper", version=VERSION, lifespan=lifespan, docs_url=None, redoc_url=None)
    app.state.settings = settings or get_settings()
    app.state.http = http
    router = APIRouter()

    async def mealie_user(
        request: Request,
        authorization: Annotated[str | None, Header()] = None,
        cookie_token: Annotated[str | None, Cookie(alias=TOKEN_COOKIE)] = None,
    ) -> MealieClient:
        token = token_from_request(authorization, cookie_token)
        if not token:
            raise HTTPException(401, "Log in to Mealie first.")
        client = MealieClient(request.app.state.settings.mealie_url, token, request.app.state.http)
        try:
            await client.current_user()
        except MealieError as e:
            raise HTTPException(401 if e.status in (401, 403) else 502, "Your Mealie login could not be confirmed.")
        except httpx.HTTPError:
            raise HTTPException(502, "The AI helper can't reach Mealie. Check MEALIE_URL.")
        return client

    User = Annotated[MealieClient, Depends(mealie_user)]

    def lock_for(request: Request, slug: str) -> asyncio.Lock:
        return request.app.state.locks.setdefault(slug, asyncio.Lock())

    @router.get("/health")
    async def health():
        return {"ok": True, "version": VERSION}

    @router.get("/status")
    async def status(request: Request, user: User):
        s: Settings = request.app.state.settings
        store: Store = request.app.state.store
        return {
            "version": VERSION,
            "images": {
                "enabled": s.images_enabled,
                "limit": s.daily_image_limit,
                "usedToday": store.images_today(),
                "model": s.openai_image_model,
                "tag": s.ai_image_tag,
            },
        }

    @router.get("/images/{slug}")
    async def image_state(slug: str, request: Request, user: User):
        recipe = await _recipe(user, slug)
        store: Store = request.app.state.store
        tagged = any((t.get("name") or "").lower() == request.app.state.settings.ai_image_tag.lower() for t in recipe.get("tags") or [])
        return {"aiImage": tagged, "canRevert": store.has_original(recipe["id"])}

    @router.post("/images/{slug}")
    async def make_image(slug: str, request: Request, user: User):
        s: Settings = request.app.state.settings
        store: Store = request.app.state.store
        if not s.images_enabled:
            raise HTTPException(503, "AI images are switched off (no OpenAI key, or the daily limit is 0).")
        async with lock_for(request, slug):
            if store.images_today() >= s.daily_image_limit:
                raise HTTPException(429, f"Today's limit of {s.daily_image_limit} AI images is used up. It resets at midnight.")
            recipe = await _recipe(user, slug)
            # keep what the recipe looked like before its first AI photo, for "Revert"
            if not store.has_original(recipe["id"]):
                current = await user.recipe_image(recipe["id"]) if recipe.get("image") else None
                store.keep_original(recipe["id"], current)
            try:
                raw = await images.generate(s, images.build_prompt(recipe), request.app.state.http)
                webp = images.crop_to_4_3(raw)
            except images.ImageError as e:
                raise HTTPException(502, str(e))
            except httpx.HTTPError:
                raise HTTPException(502, "OpenAI could not be reached. Try again in a minute.")
            store.count_image()
            await _mealie(user.upload_image(slug, webp, "webp"))
            tags = with_tag(recipe.get("tags") or [], s.ai_image_tag)
            if tags is not None:
                await _mealie(user.set_tags(slug, tags))
            log.info("AI image for %s (%s today)", slug, store.images_today())
            return {"ok": True, "usedToday": store.images_today(), "limit": s.daily_image_limit}

    @router.post("/images/{slug}/revert")
    async def revert_image(slug: str, request: Request, user: User):
        s: Settings = request.app.state.settings
        store: Store = request.app.state.store
        async with lock_for(request, slug):
            recipe = await _recipe(user, slug)
            known, original = store.original(recipe["id"])
            if not known:
                raise HTTPException(404, "There is no earlier photo to go back to.")
            if original:
                await _mealie(user.upload_image(slug, original, "webp"))
            else:
                await _mealie(user.delete_image(slug))
            tags = without_tag(recipe.get("tags") or [], s.ai_image_tag)
            if tags is not None:
                await _mealie(user.set_tags(slug, tags))
            store.forget_original(recipe["id"])
            return {"ok": True}

    # Works whether or not the proxy strips the /ai-helper prefix
    app.include_router(router, prefix="/ai-helper/api")
    app.include_router(router, prefix="/api")
    return app


async def _mealie(coro):
    try:
        return await coro
    except MealieError as e:
        if e.status in (401, 403):
            raise HTTPException(403, "Mealie didn't allow this change for your account.")
        raise HTTPException(502, str(e))


async def _recipe(user: MealieClient, slug: str) -> dict:
    try:
        return await user.recipe(slug)
    except MealieError as e:
        raise HTTPException(404 if e.status == 404 else 502, "Recipe not found." if e.status == 404 else str(e))


app = create_app()
