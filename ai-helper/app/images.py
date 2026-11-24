"""AI recipe photos: build the prompt from the recipe, ask OpenAI, crop to 4:3, return WebP bytes."""

import base64
import io
from typing import Any

import httpx
from PIL import Image

from .config import Settings


class ImageError(Exception):
    pass


def main_ingredients(recipe: dict[str, Any], limit: int = 6) -> list[str]:
    """Food names from the structured ingredients (falls back to the ingredient text), skipping
    seasoning-only items, at most `limit`."""
    skip = {"salt", "pepper", "black pepper", "water", "oil", "olive oil", "kosher salt"}
    names: list[str] = []
    for ing in recipe.get("recipeIngredient") or []:
        food = (ing.get("food") or {}).get("name") or ""
        text = food or ing.get("note") or ing.get("display") or ""
        text = " ".join(str(text).split())[:60]
        if not text or text.lower() in skip or text.lower() in (n.lower() for n in names):
            continue
        names.append(text)
        if len(names) >= limit:
            break
    return names


def build_prompt(recipe: dict[str, Any]) -> str:
    name = (recipe.get("name") or "a home-cooked dish").strip()
    description = " ".join((recipe.get("description") or "").split())[:300]
    ingredients = main_ingredients(recipe)
    parts = [
        f"Editorial cookbook food photograph of {name}.",
        f"About the dish: {description}" if description else "",
        f"Visible main ingredients: {', '.join(ingredients)}." if ingredients else "",
        "Plated and ready to eat, natural window light, soft shadows, shallow depth of field,",
        "on a warm rustic table with linen, seen from a three-quarter angle.",
        "Realistic, appetising, true to how this dish really looks at home.",
        "No text, no labels, no watermark, no hands or people.",
    ]
    return " ".join(p for p in parts if p)


def crop_to_4_3(png: bytes, max_width: int = 1600) -> bytes:
    """Centre-crop to 4:3 (the app's photo shape) and save as WebP."""
    with Image.open(io.BytesIO(png)) as im:
        im = im.convert("RGB")
        w, h = im.size
        target = 4 / 3
        if w / h > target:  # too wide: trim the sides
            new_w = round(h * target)
            left = (w - new_w) // 2
            im = im.crop((left, 0, left + new_w, h))
        elif w / h < target:  # too tall: trim top and bottom
            new_h = round(w / target)
            top = (h - new_h) // 2
            im = im.crop((0, top, w, top + new_h))
        if im.width > max_width:
            im = im.resize((max_width, round(max_width * 3 / 4)), Image.LANCZOS)
        out = io.BytesIO()
        im.save(out, "WEBP", quality=86)
        return out.getvalue()


async def generate(settings: Settings, prompt: str, client: httpx.AsyncClient) -> bytes:
    """Asks OpenAI's Images API for one landscape image; returns the raw image bytes."""
    if not settings.openai_api_key:
        raise ImageError("No OpenAI key is set for the AI helper.")
    resp = await client.post(
        f"{settings.openai_base_url}/images/generations",
        headers={"Authorization": f"Bearer {settings.openai_api_key}"},
        json={
            "model": settings.openai_image_model,
            "prompt": prompt,
            "size": "1536x1024",
            "quality": settings.openai_image_quality,
            "n": 1,
        },
        timeout=settings.request_timeout,
    )
    if resp.status_code >= 400:
        try:
            detail = resp.json().get("error", {}).get("message") or resp.text
        except ValueError:
            detail = resp.text
        raise ImageError(f"OpenAI refused the request ({resp.status_code}): {detail[:300]}")
    data = (resp.json().get("data") or [{}])[0]
    if data.get("b64_json"):
        return base64.b64decode(data["b64_json"])
    if data.get("url"):  # some models return a link instead
        img = await client.get(data["url"], timeout=settings.request_timeout)
        img.raise_for_status()
        return img.content
    raise ImageError("OpenAI returned no image.")
