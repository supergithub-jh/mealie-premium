// Mealie Premium version, shown under "Digital Cookbook" in the sidebar.
// Bump it in every release commit, together with the handoff's changelog
// (premium-version.test.ts checks they match).
export const PREMIUM_VERSION = "0.3.1";

/** "v0.3.1 · Mealie 3.31.0" (the Mealie part only when the server reports it) */
export function premiumVersionLabel(mealieVersion?: string | null): string {
  const mealie = (mealieVersion || "").trim().replace(/^v/i, "");
  return mealie ? `v${PREMIUM_VERSION} · Mealie ${mealie}` : `v${PREMIUM_VERSION}`;
}
