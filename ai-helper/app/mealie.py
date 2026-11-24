"""Talking to Mealie's normal API, always as the person who is logged in (their own token)."""

from typing import Any

import httpx

TOKEN_COOKIE = "mealie.access_token"


class MealieError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status


def token_from_request(authorization: str | None, cookie_token: str | None) -> str | None:
    """The user's Mealie token: the Authorization header the app sends, else Mealie's login cookie."""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
        if token:
            return token
    return cookie_token or None


class MealieClient:
    def __init__(self, base_url: str, token: str, client: httpx.AsyncClient):
        self.base_url = base_url
        self.token = token
        self.client = client

    @property
    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token}"}

    async def _check(self, resp: httpx.Response) -> httpx.Response:
        if resp.status_code >= 400:
            raise MealieError(resp.status_code, f"Mealie said {resp.status_code} for {resp.request.url.path}")
        return resp

    async def current_user(self) -> dict[str, Any]:
        """Confirms the login with Mealie (401 if not logged in)."""
        resp = await self.client.get(f"{self.base_url}/api/users/self", headers=self._headers)
        return (await self._check(resp)).json()

    async def recipe(self, slug: str) -> dict[str, Any]:
        resp = await self.client.get(f"{self.base_url}/api/recipes/{slug}", headers=self._headers)
        return (await self._check(resp)).json()

    async def recipe_image(self, recipe_id: str) -> bytes | None:
        """The recipe's current full-size photo, or None if it has none."""
        resp = await self.client.get(f"{self.base_url}/api/media/recipes/{recipe_id}/images/original.webp")
        if resp.status_code != 200 or not resp.content:
            return None
        return resp.content

    async def upload_image(self, slug: str, data: bytes, extension: str) -> None:
        files = {"image": (f"image.{extension}", data, f"image/{extension}")}
        resp = await self.client.put(
            f"{self.base_url}/api/recipes/{slug}/image",
            headers=self._headers,
            files=files,
            data={"extension": extension},
        )
        await self._check(resp)

    async def delete_image(self, slug: str) -> None:
        resp = await self.client.delete(f"{self.base_url}/api/recipes/{slug}/image", headers=self._headers)
        await self._check(resp)

    async def set_tags(self, slug: str, tags: list[dict[str, Any]]) -> None:
        resp = await self.client.patch(
            f"{self.base_url}/api/recipes/{slug}", headers=self._headers, json={"tags": tags}
        )
        await self._check(resp)


def with_tag(tags: list[dict[str, Any]], name: str) -> list[dict[str, Any]] | None:
    """The tag list with `name` added, or None if it is already there."""
    if any((t.get("name") or "").lower() == name.lower() for t in tags):
        return None
    return [*tags, {"name": name}]


def without_tag(tags: list[dict[str, Any]], name: str) -> list[dict[str, Any]] | None:
    """The tag list with `name` removed, or None if it wasn't there."""
    kept = [t for t in tags if (t.get("name") or "").lower() != name.lower()]
    return kept if len(kept) != len(tags) else None
