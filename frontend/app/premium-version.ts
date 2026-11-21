// Mealie Premium version, shown under "Digital Cookbook" in the sidebar.
// Bump it in every release commit, together with the handoff's changelog
// (premium-version.test.ts checks they match).
export const PREMIUM_VERSION = "0.4.2";

/** "v0.3.2": the fork's version only (Mealie's version is in Admin Settings › Site Settings). */
export function premiumVersionLabel(): string {
  return `v${PREMIUM_VERSION}`;
}
