"""Small files in the helper's data folder: today's image count, and each recipe's original photo
(kept before the first AI image replaces it, so "Revert" can put it back)."""

import json
import re
from datetime import date
from pathlib import Path


class Store:
    def __init__(self, data_dir: Path):
        self.dir = data_dir
        self.dir.mkdir(parents=True, exist_ok=True)
        (self.dir / "originals").mkdir(exist_ok=True)

    # ------------------------------------------------------------ daily limit
    @property
    def _usage_file(self) -> Path:
        return self.dir / "usage.json"

    def images_today(self, today: date | None = None) -> int:
        day = (today or date.today()).isoformat()
        try:
            data = json.loads(self._usage_file.read_text())
        except (FileNotFoundError, ValueError):
            return 0
        return int(data.get(day, 0))

    def count_image(self, today: date | None = None) -> int:
        day = (today or date.today()).isoformat()
        n = self.images_today(today) + 1
        self._usage_file.write_text(json.dumps({day: n}))  # older days are dropped
        return n

    # ------------------------------------------------------------ original photos
    def _original(self, recipe_id: str) -> Path:
        safe = re.sub(r"[^A-Za-z0-9-]", "", recipe_id)
        if not safe:
            raise ValueError("bad recipe id")
        return self.dir / "originals" / f"{safe}.webp"

    def _no_photo_marker(self, recipe_id: str) -> Path:
        return self._original(recipe_id).with_suffix(".none")

    def has_original(self, recipe_id: str) -> bool:
        return self._original(recipe_id).exists() or self._no_photo_marker(recipe_id).exists()

    def keep_original(self, recipe_id: str, image: bytes | None) -> None:
        """Remember what the recipe looked like before its first AI image (only once)."""
        if self.has_original(recipe_id):
            return
        if image:
            self._original(recipe_id).write_bytes(image)
        else:
            self._no_photo_marker(recipe_id).write_text("")

    def original(self, recipe_id: str) -> tuple[bool, bytes | None]:
        """(known, image): known is False if no original was kept; image None means "had no photo"."""
        path = self._original(recipe_id)
        if path.exists():
            return True, path.read_bytes()
        if self._no_photo_marker(recipe_id).exists():
            return True, None
        return False, None

    def forget_original(self, recipe_id: str) -> None:
        self._original(recipe_id).unlink(missing_ok=True)
        self._no_photo_marker(recipe_id).unlink(missing_ok=True)
