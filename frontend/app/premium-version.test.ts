import { readFileSync } from "fs";
import path from "path";
import { describe, expect, test } from "vitest";
import { PREMIUM_VERSION, premiumVersionLabel } from "./premium-version";

describe("Mealie Premium version", () => {
  test("matches the newest entry in the handoff changelog", () => {
    const handoff = readFileSync(path.resolve(__dirname, "../../cookbook/HANDOFF.md"), "utf8");
    const changelog = handoff.slice(handoff.indexOf("## 11. Changelog"));
    const newest = changelog.match(/\*\*v(\d+\.\d+\.\d+)\*\*/)?.[1];
    expect(newest).toBe(PREMIUM_VERSION);
  });

  test("label shows both versions, without a doubled v", () => {
    expect(premiumVersionLabel("v3.31.0")).toBe(`v${PREMIUM_VERSION} · Mealie 3.31.0`);
    expect(premiumVersionLabel("3.31.0")).toBe(`v${PREMIUM_VERSION} · Mealie 3.31.0`);
    expect(premiumVersionLabel(undefined)).toBe(`v${PREMIUM_VERSION}`);
  });
});
