// Mealie Premium: the Meal Planner's week view (v0.4.1). Pure functions, tested; PremiumPlannerView.vue
// renders the result. Input is what Mealie's planner page already computes (MealsByDate: weeks with an
// endDate for week-long entries, then their days).
import { format, isSameDay } from "date-fns";
import type { PlanEntryOut, PlanEntryType } from "~/lib/api/types/meal-plan";

export interface PlannerInput {
  date: Date;
  endDate?: Date | null;
  meals: PlanEntryOut[];
}

export interface PlannerSlot {
  type: PlanEntryType;
  meals: PlanEntryOut[];
}

export interface PlannerDay {
  key: string;
  date: Date;
  today: boolean;
  slots: PlannerSlot[];
  count: number;
}

export interface PlannerWeek {
  key: string;
  date: Date;
  endDate: Date;
  current: boolean;
  meals: PlanEntryOut[];
}

/** Mealie's meal types, in its own order. */
export const PLAN_TYPES: PlanEntryType[] = ["breakfast", "lunch", "dinner", "side", "snack", "drink", "dessert"];

/**
 * One day's slots: dinner always (so an empty evening shows "+ Add"), other types only when planned
 * (owner's decision, v0.4.1). Within a slot, entries keep the order the API gave (by id).
 */
export function daySlots(meals: PlanEntryOut[]): PlannerSlot[] {
  return PLAN_TYPES
    .map(type => ({ type, meals: meals.filter(m => m.entryType === type).sort((a, b) => a.id - b.id) }))
    .filter(slot => slot.type === "dinner" || slot.meals.length > 0);
}

/** Splits Mealie's planner list into week-long entries and days, marking today and the current week. */
export function buildPlanner(plans: PlannerInput[], today: Date): { weeks: PlannerWeek[]; days: PlannerDay[] } {
  const weeks: PlannerWeek[] = [];
  const days: PlannerDay[] = [];
  for (const plan of plans) {
    if (plan.endDate) {
      if (!plan.meals.length) continue; // a week with nothing planned for the whole week: no strip
      const start = format(plan.date, "yyyy-MM-dd");
      const end = format(plan.endDate, "yyyy-MM-dd");
      const t = format(today, "yyyy-MM-dd");
      weeks.push({ key: `w-${start}`, date: plan.date, endDate: plan.endDate, current: start <= t && t <= end, meals: plan.meals });
      continue;
    }
    days.push({
      key: format(plan.date, "yyyy-MM-dd"),
      date: plan.date,
      today: isSameDay(plan.date, today),
      slots: daySlots(plan.meals),
      count: plan.meals.length,
    });
  }
  return { weeks, days };
}

/** Name shown for an entry: its recipe, else its title (a note entry). */
export function plannerEntryName(entry: PlanEntryOut): string {
  return entry.recipe?.name || entry.title || "";
}
