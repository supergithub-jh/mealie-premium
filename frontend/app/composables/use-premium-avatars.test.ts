import { existsSync } from "fs";
import path from "path";
import { describe, expect, test } from "vitest";
import { PREMIUM_AVATARS } from "./use-premium-avatars";

describe("Premium avatars", () => {
  test("there are 12, each with a file in public/avatars/premium", () => {
    expect(PREMIUM_AVATARS).toHaveLength(12);
    for (const a of PREMIUM_AVATARS) {
      expect(existsSync(path.resolve(__dirname, "../../public/avatars/premium", a.file))).toBe(true);
    }
  });
});
