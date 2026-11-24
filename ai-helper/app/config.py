"""Settings, all from environment variables (set in the Docker compose file). No secrets in code."""

import os
from dataclasses import dataclass, field
from pathlib import Path

VERSION = "0.5.0"


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    # Where the helper reaches Mealie from inside Docker, e.g. http://mealie:9000
    mealie_url: str = field(default_factory=lambda: os.environ.get("MEALIE_URL", "http://mealie:9000").rstrip("/"))
    openai_api_key: str = field(default_factory=lambda: os.environ.get("OPENAI_API_KEY", ""))
    openai_base_url: str = field(
        default_factory=lambda: os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    )
    # Image model: a setting, so a new OpenAI model name needs no new release
    openai_image_model: str = field(default_factory=lambda: os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-2"))
    openai_image_quality: str = field(default_factory=lambda: os.environ.get("OPENAI_IMAGE_QUALITY", "medium"))
    # Images per day for the whole household; 0 = images switched off
    daily_image_limit: int = field(default_factory=lambda: _int("DAILY_IMAGE_LIMIT", 20))
    ai_image_tag: str = field(default_factory=lambda: os.environ.get("AI_IMAGE_TAG", "AI image"))
    data_dir: Path = field(default_factory=lambda: Path(os.environ.get("DATA_DIR", "/data")))
    request_timeout: float = 180.0

    @property
    def images_enabled(self) -> bool:
        return bool(self.openai_api_key) and self.daily_image_limit > 0


def get_settings() -> Settings:
    return Settings()
