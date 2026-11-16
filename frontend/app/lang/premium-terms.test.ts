import { describe, expect, test } from "vitest";
import enUS from "./messages/en-US.json";
import { applyPremiumTerms, premiumWording } from "./premium-terms";

function allStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
  }
  else if (value && typeof value === "object") {
    Object.values(value).forEach(v => allStrings(v, out));
  }
  return out;
}

describe("Premium wording (Cookbook -> Collection)", () => {
  test("keeps letter case", () => {
    expect(premiumWording("Cookbooks")).toBe("Collections");
    expect(premiumWording("Create a cookbook")).toBe("Create a collection");
    expect(premiumWording("COOKBOOK")).toBe("COLLECTION");
    expect(premiumWording("Hide Cookbooks from Other Households")).toBe("Hide Collections from Other Households");
  });

  test("no English text says cookbook after the rule, except the skipped sections", () => {
    const { migration: _m, premium: _p, ...rest } = applyPremiumTerms(enUS);
    const leftovers = allStrings(rest).filter(s => /cookbook/i.test(s));
    expect(leftovers).toEqual([]);
  });

  test("other apps' names and the fork's subtitle stay untouched", () => {
    const result = applyPremiumTerms(enUS);
    expect(JSON.stringify(result.migration)).toContain("Nextcloud Cookbook");
    expect(result.premium["digital-cookbook"]).toBe("Digital Cookbook");
    expect(result.cookbook.cookbooks).toBe("Collections");
  });
});
