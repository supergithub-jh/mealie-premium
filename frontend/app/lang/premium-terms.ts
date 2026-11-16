// Mealie Premium: fork wording applied to the English texts at load time,
// instead of editing upstream's en-US.json line by line (which would conflict
// with every upstream update). Used by lang/locales/en-US.ts.
//
// "Cookbook(s)" is called "Collection(s)" in the fork, matching letter case.

type Messages = { [key: string]: unknown };

// Top-level sections left alone:
// - migration: names other apps' features ("Nextcloud Cookbook", Cook'n cookbooks)
// - premium: the fork's own texts ("Digital Cookbook")
const SKIP_SECTIONS = new Set(["migration", "premium"]);

function matchCase(source: string, replacement: string): string {
  if (source === source.toUpperCase()) {
    return replacement.toUpperCase();
  }
  if (source[0] === source[0]?.toUpperCase()) {
    return replacement[0]!.toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

export function premiumWording(text: string): string {
  return text.replace(/cookbook/gi, match => matchCase(match, "collection"));
}

function transform(value: unknown): unknown {
  if (typeof value === "string") {
    return premiumWording(value);
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value as Messages).map(([k, v]) => [k, transform(v)]));
  }
  return value;
}

export function applyPremiumTerms<T extends Messages>(messages: T): T {
  return Object.fromEntries(
    Object.entries(messages).map(([section, value]) => [section, SKIP_SECTIONS.has(section) ? value : transform(value)]),
  ) as T;
}
