// Mealie Premium: logic for the Home page (phase 4). Pure functions, so they can be tested without
// a running app; the page (PremiumHome.vue) does the API calls.
import { addDays, format, getISOWeek, getISOWeekYear, startOfWeek } from "date-fns";
import type { Day } from "date-fns";
import type { PlanEntryOut, PlanEntryType } from "~/lib/api/types/meal-plan";

/** Slug of the tag the AI helper (phase 5) puts on its weekly import. */
export const RECIPE_OF_THE_WEEK_SLUG = "recipe-of-the-week";

/** Where the Browse chips are kept: this browser only (owner's choice A; no backend changes). */
export const PREMIUM_CHIPS_STORAGE_KEY = "premium-home-chips";

// ------------------------------------------------------------------ Recipe of the Week

/** "2026-W47": the same all week (ISO weeks start on Monday), different next week. */
export function weekKey(date: Date): string {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, "0")}`;
}

/** A stable position in 0..total-1 for this week, so everyone in the household sees the same pick. */
export function weeklyIndex(key: string, total: number): number {
  if (total <= 0) return -1;
  // FNV-1a: small, stable across browsers
  let hash = 0x811C9DC5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % total;
}

// ------------------------------------------------------------------ Week and Tonight

/** The 7 days of the week containing `today`, starting on the household's first day (0 = Sunday). */
export function weekDays(today: Date, firstDayOfWeek: number): Date[] {
  const start = startOfWeek(today, { weekStartsOn: (firstDayOfWeek % 7) as Day });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isoDay(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Entries of one type planned for `day`, including week-long entries (date … endDate) that cover it. */
export function entriesOn(entries: PlanEntryOut[], day: Date, type: PlanEntryType): PlanEntryOut[] {
  const d = isoDay(day);
  return entries.filter((e) => {
    if (e.entryType !== type) return false;
    const end = e.endDate || e.date;
    return e.date <= d && d <= end;
  }).sort((a, b) => Number(!!a.endDate) - Number(!!b.endDate) || a.id - b.id); // day entries first
}

/** What to show for an entry: its recipe's name, else its title (a note entry). */
export function entryName(entry: PlanEntryOut): string {
  return entry.recipe?.name || entry.title || "";
}

export type GreetingKey = "premium.good-morning" | "premium.good-afternoon" | "premium.good-evening";

export function greetingKey(hour: number): GreetingKey {
  if (hour >= 5 && hour < 12) return "premium.good-morning";
  if (hour >= 12 && hour < 17) return "premium.good-afternoon";
  return "premium.good-evening";
}

// ------------------------------------------------------------------ Browse chips

export type PremiumChipKind = "favorites" | "tags" | "categories" | "tools";

export interface PremiumChip {
  kind: PremiumChipKind;
  /** Organizer id; empty for favourites */
  id: string;
  /** Organizer name as last seen; favourites use the translated label */
  name: string;
}

export interface PremiumOrganizer {
  id: string;
  name: string;
  slug: string;
  recipeCount: number;
}

export function chipKey(chip: Pick<PremiumChip, "kind" | "id">): string {
  return `${chip.kind}:${chip.id}`;
}

/**
 * The automatic pick: Favourites, then the most-used tags and categories, alternating (tags first),
 * then tools, skipping empty ones and the Recipe of the Week tag. At most `max` chips.
 */
export function autoChips(
  organizers: { tags: PremiumOrganizer[]; categories: PremiumOrganizer[]; tools: PremiumOrganizer[] },
  max = 7,
): PremiumChip[] {
  const top = (list: PremiumOrganizer[], kind: PremiumChipKind) => list
    .filter(o => o.recipeCount > 0 && o.slug !== RECIPE_OF_THE_WEEK_SLUG)
    .sort((a, b) => b.recipeCount - a.recipeCount || a.name.localeCompare(b.name))
    .map(o => ({ kind, id: o.id, name: o.name }) as PremiumChip);

  const tags = top(organizers.tags, "tags");
  const categories = top(organizers.categories, "categories");
  const tools = top(organizers.tools, "tools");

  const chips: PremiumChip[] = [{ kind: "favorites", id: "", name: "" }];
  for (let i = 0; chips.length < max && (i < tags.length || i < categories.length); i++) {
    if (tags[i]) chips.push(tags[i]!);
    if (chips.length < max && categories[i]) chips.push(categories[i]!);
  }
  for (const tool of tools) {
    if (chips.length >= max) break;
    chips.push(tool);
  }
  return chips;
}

/**
 * The user's saved chips, checked against what exists now: chips whose tag/category/tool was deleted are
 * dropped, renamed ones take the new name, duplicates are removed.
 */
export function reconcileChips(
  saved: PremiumChip[],
  organizers: { tags: PremiumOrganizer[]; categories: PremiumOrganizer[]; tools: PremiumOrganizer[] },
): PremiumChip[] {
  const seen = new Set<string>();
  const out: PremiumChip[] = [];
  for (const chip of saved) {
    if (!chip || typeof chip !== "object") continue;
    const key = chipKey(chip);
    if (seen.has(key)) continue;
    if (chip.kind === "favorites") {
      seen.add(key);
      out.push({ kind: "favorites", id: "", name: "" });
      continue;
    }
    const list = organizers[chip.kind as "tags" | "categories" | "tools"];
    const match = list?.find(o => o.id === chip.id);
    if (!match) continue;
    seen.add(key);
    out.push({ kind: chip.kind, id: match.id, name: match.name });
  }
  return out;
}

/** Everything that could be added: favourites (if missing) and all non-empty tags, categories and tools. */
export function availableChips(
  current: PremiumChip[],
  organizers: { tags: PremiumOrganizer[]; categories: PremiumOrganizer[]; tools: PremiumOrganizer[] },
): PremiumChip[] {
  const taken = new Set(current.map(chipKey));
  const all: PremiumChip[] = [{ kind: "favorites", id: "", name: "" }];
  for (const kind of ["tags", "categories", "tools"] as const) {
    organizers[kind]
      .filter(o => o.recipeCount > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(o => all.push({ kind, id: o.id, name: o.name }));
  }
  return all.filter(c => !taken.has(chipKey(c)));
}

/** Where a chip leads: the Recipes page filtered, or the user's favourites page. */
export function chipLink(chip: PremiumChip, groupSlug: string, userId: string): string {
  if (chip.kind === "favorites") return `/user/${userId}/favorites`;
  return `/g/${groupSlug}/recipes?${chip.kind}=${encodeURIComponent(chip.id)}`;
}
