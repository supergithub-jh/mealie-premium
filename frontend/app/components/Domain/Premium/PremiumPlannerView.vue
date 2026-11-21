<template>
  <!-- Mealie Premium Meal Planner, view mode (v0.4.1): one card per day (7 columns on wide screens, one
       column on phones), dinner always has a slot, other meal types only when planned. Week-long entries
       sit in a strip above the days. Adding and editing use Mealie's own dialog; Mealie's toolbar (range,
       Edit, menu) stays above this, in pages/household/mealplan/planner.vue. -->
  <div class="premium-planner">
    <GroupMealPlanEntryDialog
      v-model="dialog.open"
      :entry="dialog.entry"
      :date="dialog.date"
      :end-date="dialog.endDate"
      @create="actions.createOne($event)"
      @update="actions.updateOne($event)"
    />

    <section
      v-for="week in planner.weeks"
      :key="week.key"
      class="premium-planner__week"
      :class="{ 'premium-planner__week--current': week.current }"
      :aria-label="$t('premium.for-the-week')"
    >
      <div class="premium-planner__week-head">
        <span class="premium-planner__week-title">{{ $t("premium.for-the-week") }}</span>
        <span class="premium-planner__muted">{{ $d(week.date, "short") }} – {{ $d(week.endDate, "short") }}</span>
      </div>
      <div class="premium-planner__week-meals">
        <div
          v-for="meal in week.meals"
          :key="meal.id"
          class="premium-planner__entry premium-planner__entry--row"
        >
          <PremiumPlannerEntry
            :meal="meal"
            :actions="actions"
            :group-slug="groupSlug"
            week
            @edit="editMeal(meal)"
          />
        </div>
      </div>
    </section>

    <div class="premium-planner__days">
      <section
        v-for="day in planner.days"
        :key="day.key"
        class="premium-planner__day"
        :class="{ 'premium-planner__day--today': day.today }"
        :aria-label="longDate(day.date)"
        :aria-current="day.today ? 'date' : undefined"
      >
        <header class="premium-planner__day-head">
          <span class="premium-planner__weekday">{{ day.today ? $t("premium.today") : weekday(day.date) }}</span>
          <span class="premium-planner__date">{{ shortDate(day.date) }}</span>
        </header>

        <div
          v-for="slot in day.slots"
          :key="slot.type"
          class="premium-planner__slot"
        >
          <div class="premium-planner__type">
            {{ typeLabel(slot.type) }}
          </div>
          <div
            v-for="meal in slot.meals"
            :key="meal.id"
            class="premium-planner__entry"
          >
            <PremiumPlannerEntry
              :meal="meal"
              :actions="actions"
              :group-slug="groupSlug"
              @edit="editMeal(meal)"
            />
          </div>
          <button
            v-if="!slot.meals.length"
            type="button"
            class="premium-planner__add premium-planner__add--slot"
            @click="addMeal(day.date)"
          >
            <v-icon :icon="mdiPlus" size="18" />
            {{ $t("premium.add-meal") }}
          </button>
        </div>

        <button
          v-if="day.count"
          type="button"
          class="premium-planner__add"
          :aria-label="$t('premium.add-meal-to', [longDate(day.date)])"
          @click="addMeal(day.date)"
        >
          <v-icon :icon="mdiPlus" size="18" />
          {{ $t("premium.add-meal") }}
        </button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mdiPlus } from "@mdi/js";
import PremiumPlannerEntry from "./PremiumPlannerEntry.vue";
import GroupMealPlanEntryDialog from "~/components/Domain/Household/GroupMealPlanEntryDialog.vue";
import type { MealsByDate, useMealplans } from "~/composables/use-group-mealplan";
import { buildPlanner } from "~/composables/use-premium-planner";
import type { PlanEntryOut, PlanEntryType } from "~/lib/api/types/meal-plan";

const props = defineProps<{
  mealplans: MealsByDate[];
  actions: ReturnType<typeof useMealplans>["actions"];
}>();

const i18n = useI18n();
const auth = useMealieAuth();
const groupSlug = computed(() => auth.user.value?.groupSlug || "");

const now = ref(new Date());
const planner = computed(() => buildPlanner(props.mealplans || [], now.value));

const locale = computed(() => i18n.locale.value);
const weekday = (d: Date) => new Intl.DateTimeFormat(locale.value, { weekday: "short" }).format(d);
const shortDate = (d: Date) => new Intl.DateTimeFormat(locale.value, { day: "numeric", month: "short" }).format(d);
const longDate = (d: Date) => new Intl.DateTimeFormat(locale.value, { weekday: "long", day: "numeric", month: "long" }).format(d);
const typeLabel = (t: PlanEntryType) => i18n.t(`meal-plan.${t}`);

const dialog = reactive({
  open: false,
  entry: null as PlanEntryOut | null,
  date: null as Date | null,
  endDate: null as Date | null,
});

function addMeal(date: Date) {
  dialog.entry = null;
  dialog.date = date;
  dialog.endDate = null;
  dialog.open = true;
}

function editMeal(meal: PlanEntryOut) {
  dialog.entry = meal;
  dialog.date = null;
  dialog.endDate = null;
  dialog.open = true;
}
</script>

<style scoped>
.premium-planner {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.premium-planner__muted {
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 0.85rem;
}

/* Week-long entries */
.premium-planner__week {
  background: var(--premium-soft);
  border-radius: 16px;
  padding: 12px 16px 16px;
}

.premium-planner__week-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
}

.premium-planner__week-title {
  font-family: "Playfair Display", Georgia, serif;
  font-weight: 600;
  font-size: 1.15rem;
}

.premium-planner__week-meals {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
}

/* Days: 7 columns when there's room, else as many ~220px columns as fit, one column on phones */
.premium-planner__days {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  align-items: start;
}

@container (min-width: 960px) {
  .premium-planner__days {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
}

@container (max-width: 559px) {
  .premium-planner__days {
    grid-template-columns: minmax(0, 1fr);
  }
}

.premium-planner__day {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  box-shadow: var(--cookbook-shadow, 0 4px 16px rgba(50, 44, 37, 0.06));
  min-width: 0;
}

.premium-planner__day--today {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

.premium-planner__day-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.premium-planner__weekday {
  font-weight: 600;
}

.premium-planner__day--today .premium-planner__weekday,
.premium-planner__day--today .premium-planner__date {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.premium-planner__date {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.premium-planner__slot {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.premium-planner__type {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.premium-planner__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 44px;
  padding: 0 12px;
  border: 1.5px dashed rgba(var(--v-theme-primary), 0.5);
  border-radius: 10px;
  background: transparent;
  color: rgb(var(--v-theme-primary));
  font: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}

.premium-planner__add:not(.premium-planner__add--slot) {
  border-style: solid;
  border-color: transparent;
  align-self: flex-start;
}

.premium-planner__add:hover,
.premium-planner__add:focus-visible {
  background: rgba(var(--v-theme-primary), 0.08);
  outline: none;
}

.v-theme--dark .premium-planner__day {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
}
</style>
