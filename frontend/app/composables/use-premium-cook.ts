// Mealie Premium: small shared helpers for Cook mode.
import type { RecipeOut } from "~/lib/api/types/recipe";

/** Where Cook mode remembers the current step for a recipe (this device only). */
export function cookStepStorageKey(recipe: Pick<RecipeOut, "id" | "slug">): string {
  return `premium-cook-step:${recipe.id || recipe.slug}`;
}

/** Cook mode's own light/dark choice: "auto" follows the app's setting. */
export const COOK_THEME_KEY = "premium-cook-theme";
export type CookTheme = "auto" | "light" | "dark";
