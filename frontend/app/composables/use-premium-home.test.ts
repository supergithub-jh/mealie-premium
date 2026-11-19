import { describe, expect, test } from "vitest";
import {
  autoChips,
  availableChips,
  chipLink,
  entriesOn,
  entryName,
  greetingKey,
  isoDay,
  reconcileChips,
  weekDays,
  weekKey,
  weeklyIndex,
  type PremiumOrganizer,
} from "./use-premium-home";
import type { PlanEntryOut } from "~/lib/api/types/meal-plan";

const org = (id: string, name: string, recipeCount: number, slug = name.toLowerCase()): PremiumOrganizer => ({ id, name, slug, recipeCount });

function entry(partial: Partial<PlanEntryOut>): PlanEntryOut {
  return {
    date: "2026-11-19",
    endDate: null,
    entryType: "dinner",
    title: "",
    text: "",
    recipeId: null,
    recipeScale: 1,
    id: 1,
    groupId: "g",
    userId: "u",
    householdId: "h",
    recipe: null,
    updatedAt: null,
    ...partial,
  };
}

describe("Recipe of the Week pick", () => {
  test("same key all week, new key next week", () => {
    expect(weekKey(new Date(2026, 10, 16))).toBe(weekKey(new Date(2026, 10, 22))); // Mon … Sun
    expect(weekKey(new Date(2026, 10, 23))).not.toBe(weekKey(new Date(2026, 10, 22)));
    expect(weekKey(new Date(2026, 10, 19))).toBe("2026-W47");
  });

  test("index is stable and in range", () => {
    for (const total of [1, 2, 7, 250]) {
      const i = weeklyIndex("2026-W47", total);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(total);
      expect(weeklyIndex("2026-W47", total)).toBe(i);
    }
    expect(weeklyIndex("2026-W47", 0)).toBe(-1);
  });

  test("different weeks spread over the recipes", () => {
    const picks = new Set(Array.from({ length: 20 }, (_, w) => weeklyIndex(`2026-W${w}`, 50)));
    expect(picks.size).toBeGreaterThan(10);
  });
});

describe("week and tonight", () => {
  test("week follows the household's first day", () => {
    const thu = new Date(2026, 10, 19);
    expect(weekDays(thu, 1).map(isoDay)[0]).toBe("2026-11-16"); // Monday
    expect(weekDays(thu, 0).map(isoDay)[0]).toBe("2026-11-15"); // Sunday
    expect(weekDays(thu, 1)).toHaveLength(7);
  });

  test("entries on a day include week-long entries, day entries first", () => {
    const entries = [
      entry({ id: 1, date: "2026-11-16", endDate: "2026-11-22", title: "Leftovers week" }),
      entry({ id: 2, date: "2026-11-19", title: "Tacos" }),
      entry({ id: 3, date: "2026-11-19", entryType: "lunch", title: "Soup" }),
      entry({ id: 4, date: "2026-11-20", title: "Pizza" }),
    ];
    const tonight = entriesOn(entries, new Date(2026, 10, 19), "dinner");
    expect(tonight.map(e => e.id)).toEqual([2, 1]);
    expect(entriesOn(entries, new Date(2026, 10, 23), "dinner")).toEqual([]);
  });

  test("entry name prefers the recipe", () => {
    expect(entryName(entry({ title: "Note", recipe: { name: "Miso Chicken" } as PlanEntryOut["recipe"] }))).toBe("Miso Chicken");
    expect(entryName(entry({ title: "Eat out" }))).toBe("Eat out");
  });

  test("greeting by hour", () => {
    expect(greetingKey(7)).toBe("premium.good-morning");
    expect(greetingKey(13)).toBe("premium.good-afternoon");
    expect(greetingKey(19)).toBe("premium.good-evening");
    expect(greetingKey(2)).toBe("premium.good-evening");
  });
});

describe("Browse chips", () => {
  const organizers = {
    tags: [org("t1", "Quick", 12), org("t2", "Chicken", 20), org("t3", "Empty", 0), org("t4", "Recipe of the Week", 30, "recipe-of-the-week")],
    categories: [org("c1", "Dinner", 40), org("c2", "Baking", 5)],
    tools: [org("x1", "Air fryer", 3)],
  };

  test("automatic: favourites, then most-used tags and categories, skipping empty and Recipe of the Week", () => {
    const chips = autoChips(organizers);
    expect(chips.map(c => c.name || c.kind)).toEqual(["favorites", "Chicken", "Dinner", "Quick", "Baking", "Air fryer"]);
    expect(autoChips(organizers, 3)).toHaveLength(3);
  });

  test("saved chips drop deleted items, take new names, no duplicates", () => {
    const saved = [
      { kind: "tags" as const, id: "t1", name: "Old name" },
      { kind: "tags" as const, id: "gone", name: "Deleted" },
      { kind: "favorites" as const, id: "", name: "" },
      { kind: "tags" as const, id: "t1", name: "Quick" },
    ];
    expect(reconcileChips(saved, organizers)).toEqual([
      { kind: "tags", id: "t1", name: "Quick" },
      { kind: "favorites", id: "", name: "" },
    ]);
  });

  test("available chips exclude ones already shown and empty ones", () => {
    const current = [{ kind: "favorites" as const, id: "", name: "" }, { kind: "tags" as const, id: "t2", name: "Chicken" }];
    const names = availableChips(current, organizers).map(c => c.name);
    expect(names).not.toContain("Chicken");
    expect(names).not.toContain("Empty");
    expect(names).toContain("Air fryer");
    expect(availableChips(current, organizers).some(c => c.kind === "favorites")).toBe(false);
  });

  test("links", () => {
    expect(chipLink({ kind: "tags", id: "t1", name: "Quick" }, "home", "u1")).toBe("/g/home/recipes?tags=t1");
    expect(chipLink({ kind: "favorites", id: "", name: "" }, "home", "u1")).toBe("/user/u1/favorites");
  });
});
