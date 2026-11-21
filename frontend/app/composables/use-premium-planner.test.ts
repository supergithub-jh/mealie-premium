import { describe, expect, test } from "vitest";
import { buildPlanner, daySlots, plannerEntryName } from "./use-premium-planner";
import type { PlanEntryOut } from "~/lib/api/types/meal-plan";

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

describe("planner day slots", () => {
  test("dinner always shows, other types only when planned, in Mealie's order", () => {
    expect(daySlots([]).map(s => s.type)).toEqual(["dinner"]);
    const slots = daySlots([
      entry({ id: 3, entryType: "side" }),
      entry({ id: 1, entryType: "breakfast" }),
      entry({ id: 2, entryType: "dinner" }),
    ]);
    expect(slots.map(s => s.type)).toEqual(["breakfast", "dinner", "side"]);
  });

  test("entries in a slot keep id order", () => {
    const slots = daySlots([entry({ id: 5 }), entry({ id: 2 })]);
    expect(slots[0]!.meals.map(m => m.id)).toEqual([2, 5]);
  });
});

describe("planner weeks and days", () => {
  const today = new Date(2026, 10, 19);
  const plans = [
    { date: new Date(2026, 10, 16), endDate: new Date(2026, 10, 22), meals: [entry({ id: 9, date: "2026-11-16", endDate: "2026-11-22", title: "Leftovers" })] },
    { date: new Date(2026, 10, 16), meals: [entry({ id: 1, date: "2026-11-16" })] },
    { date: new Date(2026, 10, 19), meals: [] },
    { date: new Date(2026, 10, 23), endDate: new Date(2026, 10, 29), meals: [] },
  ];

  test("week entries become a strip, empty weeks are skipped, today is marked", () => {
    const { weeks, days } = buildPlanner(plans, today);
    expect(weeks).toHaveLength(1);
    expect(weeks[0]!.current).toBe(true);
    expect(days.map(d => [d.key, d.today, d.count])).toEqual([["2026-11-16", false, 1], ["2026-11-19", true, 0]]);
  });

  test("entry names", () => {
    expect(plannerEntryName(entry({ title: "Eat out" }))).toBe("Eat out");
    expect(plannerEntryName(entry({ recipe: { name: "Tacos" } as PlanEntryOut["recipe"] }))).toBe("Tacos");
  });
});
