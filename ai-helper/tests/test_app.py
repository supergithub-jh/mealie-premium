"""Helper tests with fake Mealie and OpenAI (httpx.MockTransport): no network, no keys."""

import base64
import io
import json

import httpx
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app import images
from app.config import Settings
from app.main import create_app
from app.mealie import token_from_request, with_tag, without_tag
from app.store import Store

RECIPE = {
    "id": "7c00a338-600c-4b18-90e2-5d2e525ae35e",
    "slug": "lemon-herb-salmon",
    "name": "Lemon Herb Salmon",
    "description": "Fresh, flaky salmon with lemon and herbs.",
    "image": "abc",
    "tags": [{"id": "t1", "name": "Quick", "slug": "quick"}],
    "recipeIngredient": [
        {"food": {"name": "salmon fillet"}, "note": "", "display": "4 salmon fillets"},
        {"food": {"name": "salt"}, "display": "1 tsp salt"},
        {"food": None, "note": "fresh dill", "display": "1 tbsp fresh dill"},
        {"food": {"name": "lemon"}, "display": "1 lemon"},
    ],
}


def png(w=1536, h=1024, color=(200, 180, 150)) -> bytes:
    out = io.BytesIO()
    Image.new("RGB", (w, h), color).save(out, "PNG")
    return out.getvalue()


class Fake:
    """Records calls and answers like Mealie and OpenAI."""

    def __init__(self):
        self.calls: list[tuple[str, str]] = []
        self.uploads: list[bytes] = []
        self.patches: list[dict] = []
        self.deleted = 0
        self.recipe = json.loads(json.dumps(RECIPE))
        self.openai_status = 200
        self.users_status = 200

    def handler(self, request: httpx.Request) -> httpx.Response:
        path = request.url.path
        self.calls.append((request.method, path))
        if request.url.host == "openai.test":
            if self.openai_status != 200:
                return httpx.Response(self.openai_status, json={"error": {"message": "model not found"}})
            body = json.loads(request.content)
            assert body["size"] == "1536x1024"
            return httpx.Response(200, json={"data": [{"b64_json": base64.b64encode(png()).decode()}]})
        auth = request.headers.get("authorization")
        if path == "/api/users/self":
            if auth != "Bearer good" or self.users_status != 200:
                return httpx.Response(401)
            return httpx.Response(200, json={"id": "u1"})
        if path.startswith("/api/media/recipes/"):
            return httpx.Response(200, content=b"ORIGINAL-WEBP")
        if path == "/api/recipes/lemon-herb-salmon/image":
            if request.method == "PUT":
                self.uploads.append(request.content)
                self.recipe["image"] = "new"
                return httpx.Response(200, json={"image": "new"})
            if request.method == "DELETE":
                self.deleted += 1
                return httpx.Response(200, json={})
        if path == "/api/recipes/lemon-herb-salmon":
            if request.method == "GET":
                return httpx.Response(200, json=self.recipe)
            if request.method == "PATCH":
                data = json.loads(request.content)
                self.patches.append(data)
                self.recipe["tags"] = data["tags"]
                return httpx.Response(200, json=self.recipe)
        if path.startswith("/api/recipes/"):
            return httpx.Response(404)
        return httpx.Response(500)


@pytest.fixture
def setup(tmp_path):
    fake = Fake()
    settings = Settings(
        mealie_url="http://mealie.test",
        openai_api_key="sk-test",
        openai_base_url="http://openai.test/v1",
        daily_image_limit=2,
        data_dir=tmp_path,
    )
    http = httpx.AsyncClient(transport=httpx.MockTransport(fake.handler))
    app = create_app(settings, http)
    with TestClient(app) as client:
        yield client, fake, settings


AUTH = {"Authorization": "Bearer good"}


def test_health_needs_no_login(setup):
    client, _, _ = setup
    assert client.get("/ai-helper/api/health").json()["ok"] is True
    assert client.get("/api/health").status_code == 200  # proxy that strips the prefix


def test_requests_need_a_mealie_login(setup):
    client, _, _ = setup
    assert client.get("/ai-helper/api/status").status_code == 401
    assert client.get("/ai-helper/api/status", headers={"Authorization": "Bearer bad"}).status_code == 401
    # Mealie's login cookie works too
    client.cookies.set("mealie.access_token", "good")
    assert client.get("/ai-helper/api/status").status_code == 200


def test_generate_uploads_4_3_webp_and_tags(setup):
    client, fake, _ = setup
    r = client.post("/ai-helper/api/images/lemon-herb-salmon", headers=AUTH)
    assert r.status_code == 200, r.text
    assert r.json()["usedToday"] == 1
    assert len(fake.uploads) == 1
    assert b"RIFF" in fake.uploads[0] and b"WEBP" in fake.uploads[0]
    assert fake.patches[-1]["tags"][-1] == {"name": "AI image"}
    # the original photo was kept for Revert
    state = client.get("/ai-helper/api/images/lemon-herb-salmon", headers=AUTH).json()
    assert state == {"aiImage": True, "canRevert": True}


def test_regenerate_keeps_the_first_original_and_tag_once(setup):
    client, fake, _ = setup
    client.post("/ai-helper/api/images/lemon-herb-salmon", headers=AUTH)
    client.post("/ai-helper/api/images/lemon-herb-salmon", headers=AUTH)
    assert len(fake.patches) == 1  # tag added only once
    media_reads = [c for c in fake.calls if c[1].startswith("/api/media/")]
    assert len(media_reads) == 1  # original fetched only before the first AI image


def test_daily_limit(setup):
    client, _, _ = setup
    for _ in range(2):
        assert client.post("/ai-helper/api/images/lemon-herb-salmon", headers=AUTH).status_code == 200
    r = client.post("/ai-helper/api/images/lemon-herb-salmon", headers=AUTH)
    assert r.status_code == 429


def test_revert_restores_original_and_removes_tag(setup):
    client, fake, _ = setup
    client.post("/ai-helper/api/images/lemon-herb-salmon", headers=AUTH)
    r = client.post("/ai-helper/api/images/lemon-herb-salmon/revert", headers=AUTH)
    assert r.status_code == 200
    assert b"ORIGINAL-WEBP" in fake.uploads[-1]
    assert all(t.get("name") != "AI image" for t in fake.recipe["tags"])
    assert client.post("/ai-helper/api/images/lemon-herb-salmon/revert", headers=AUTH).status_code == 404


def test_revert_of_recipe_that_had_no_photo_deletes_image(setup):
    client, fake, _ = setup
    fake.recipe["image"] = None
    client.post("/ai-helper/api/images/lemon-herb-salmon", headers=AUTH)
    client.post("/ai-helper/api/images/lemon-herb-salmon/revert", headers=AUTH)
    assert fake.deleted == 1


def test_openai_error_is_explained_and_not_counted(setup):
    client, fake, _ = setup
    fake.openai_status = 404
    r = client.post("/ai-helper/api/images/lemon-herb-salmon", headers=AUTH)
    assert r.status_code == 502
    assert "model not found" in r.json()["detail"]
    assert client.get("/ai-helper/api/status", headers=AUTH).json()["images"]["usedToday"] == 0


def test_switched_off_without_key(tmp_path):
    settings = Settings(mealie_url="http://mealie.test", openai_api_key="", data_dir=tmp_path)
    fake = Fake()
    app = create_app(settings, httpx.AsyncClient(transport=httpx.MockTransport(fake.handler)))
    with TestClient(app) as client:
        assert client.get("/ai-helper/api/status", headers=AUTH).json()["images"]["enabled"] is False
        assert client.post("/ai-helper/api/images/lemon-herb-salmon", headers=AUTH).status_code == 503


def test_unknown_recipe(setup):
    client, _, _ = setup
    assert client.post("/ai-helper/api/images/nope", headers=AUTH).status_code == 404


# ------------------------------------------------------------------ pure helpers

def test_prompt_uses_name_description_and_main_ingredients():
    p = images.build_prompt(RECIPE)
    assert "Lemon Herb Salmon" in p and "salmon fillet" in p and "fresh dill" in p and "lemon" in p
    assert "salt," not in p  # seasoning skipped
    assert "No text" in p


def test_crop_to_4_3():
    out = images.crop_to_4_3(png(1536, 1024))
    with Image.open(io.BytesIO(out)) as im:
        assert im.format == "WEBP"
        assert abs(im.width / im.height - 4 / 3) < 0.01
    with Image.open(io.BytesIO(images.crop_to_4_3(png(1024, 1536)))) as im:
        assert abs(im.width / im.height - 4 / 3) < 0.01


def test_token_and_tags():
    assert token_from_request("Bearer abc", None) == "abc"
    assert token_from_request(None, "cookie") == "cookie"
    assert token_from_request("Basic x", None) is None
    tags = [{"name": "Quick"}]
    assert with_tag(tags, "AI image") == [{"name": "Quick"}, {"name": "AI image"}]
    assert with_tag([{"name": "ai image"}], "AI image") is None
    assert without_tag([{"name": "AI image"}, {"name": "Quick"}], "AI image") == [{"name": "Quick"}]
    assert without_tag(tags, "AI image") is None


def test_store_original_kept_once(tmp_path):
    s = Store(tmp_path)
    s.keep_original("r-1", b"first")
    s.keep_original("r-1", b"second")
    assert s.original("r-1") == (True, b"first")
    s.forget_original("r-1")
    assert s.original("r-1") == (False, None)
    s.keep_original("r-2", None)
    assert s.original("r-2") == (True, None)
