<template>
  <!-- One planned meal: 4:3 photo (or placeholder), name, and a menu (open, Cook Mode, servings, edit,
       remove; week entries also "Cooking it today"). Photo on top in day columns, beside the name in a
       single column (phones) and in the week strip. -->
  <div
    class="premium-entry"
    :class="{ 'premium-entry--row': week }"
  >
    <component
      :is="meal.recipe ? NuxtLink : 'div'"
      :to="meal.recipe ? recipeLink : undefined"
      class="premium-entry__main"
    >
      <PremiumRecipeImage
        v-if="meal.recipe"
        :recipe="meal.recipe"
        compact
        class="premium-entry__photo"
      />
      <div
        v-else
        class="premium-entry__note-icon"
        aria-hidden="true"
      >
        <v-icon :icon="mdiNoteTextOutline" size="22" />
      </div>
      <div class="premium-entry__text">
        <div class="premium-entry__name">
          {{ name }}
        </div>
        <div
          v-if="!meal.recipe && meal.text"
          class="premium-entry__sub"
        >
          {{ meal.text }}
        </div>
        <div
          v-else-if="meal.recipe && meal.recipeScale && meal.recipeScale !== 1"
          class="premium-entry__sub"
        >
          ×{{ meal.recipeScale }}
        </div>
      </div>
    </component>

    <v-menu
      location="bottom end"
      :close-on-content-click="false"
    >
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          icon
          variant="text"
          class="premium-entry__menu"
          :aria-label="$t('premium.meal-actions', [name])"
        >
          <v-icon :icon="mdiDotsVertical" />
        </v-btn>
      </template>
      <v-list
        density="comfortable"
        class="premium-menu"
      >
        <v-list-item
          v-if="meal.recipe"
          :prepend-icon="mdiChefHat"
          :title="$t('premium.cook-mode')"
          :to="`${recipeLink}?cook=true`"
        />
        <v-list-item
          v-if="week"
          :prepend-icon="mdiPotSteamOutline"
          :title="$t('meal-plan.cooking-it-today')"
          @click="cookToday"
        />
        <v-list-item
          v-if="meal.recipe"
          :title="$t('recipe.servings')"
          :prepend-icon="mdiAccountGroupOutline"
        >
          <template #append>
            <MealPlanScaleControl
              :meal="meal"
              :actions="actions"
            />
          </template>
        </v-list-item>
        <v-list-item
          :prepend-icon="mdiCalendarEdit"
          :title="$t('meal-plan.edit-meal-plan')"
          @click="$emit('edit')"
        />
        <v-list-item
          :prepend-icon="mdiCalendarRemove"
          :title="$t('meal-plan.remove-from-plan')"
          @click="actions.deleteOne(meal.id)"
        />
      </v-list>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { format } from "date-fns";
import {
  mdiAccountGroupOutline,
  mdiCalendarEdit,
  mdiCalendarRemove,
  mdiChefHat,
  mdiDotsVertical,
  mdiNoteTextOutline,
  mdiPotSteamOutline,
} from "@mdi/js";
import PremiumRecipeImage from "./PremiumRecipeImage.vue";
import { NuxtLink } from "#components";
import MealPlanScaleControl from "~/components/Domain/Mealplan/MealPlanScaleControl.vue";
import type { useMealplans } from "~/composables/use-group-mealplan";
import { plannerEntryName } from "~/composables/use-premium-planner";
import type { PlanEntryOut } from "~/lib/api/types/meal-plan";

const props = withDefaults(defineProps<{
  meal: PlanEntryOut;
  actions: ReturnType<typeof useMealplans>["actions"];
  groupSlug: string;
  /** Week-long entry: shown as a row, with "Cooking it today" */
  week?: boolean;
}>(), { week: false });
defineEmits<{ edit: [] }>();

const name = computed(() => plannerEntryName(props.meal));
const recipeLink = computed(() => `/g/${props.groupSlug}/r/${props.meal.recipe?.slug}`);

/** Moves a week entry onto today, as Mealie's own planner does */
function cookToday() {
  props.actions.updateOne({ ...props.meal, date: format(new Date(), "yyyy-MM-dd"), endDate: null });
}
</script>

<style scoped>
.premium-entry {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 2px;
}

.premium-entry__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: inherit;
  text-decoration: none;
  border-radius: 10px;
}

.premium-entry__main:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.premium-entry__photo {
  border-radius: 10px !important;
}

.premium-entry__photo :deep(.v-icon) {
  font-size: 28px !important;
}

.premium-entry__note-icon {
  display: none;
}

.premium-entry__name {
  font-size: 0.92rem;
  font-weight: 500;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

a.premium-entry__main:hover .premium-entry__name {
  text-decoration: underline;
}

.premium-entry__sub {
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

/* In day columns the menu sits over the photo's corner */
.premium-entry__menu {
  width: 44px !important;
  height: 44px !important;
  position: absolute !important;
  top: 4px;
  right: 4px;
  background: rgba(var(--v-theme-surface), 0.92) !important;
}

/* Row layout: week strip, and single-column days (phones) */
.premium-entry--row .premium-entry__main {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.premium-entry--row .premium-entry__photo,
.premium-entry--row .premium-entry__note-icon {
  width: 72px !important;
  flex-shrink: 0;
}

.premium-entry--row .premium-entry__menu {
  position: static !important;
  background: transparent !important;
  align-self: center;
}

.premium-entry--row .premium-entry__note-icon,
.premium-entry__main:not(a) .premium-entry__note-icon {
  display: flex;
}

.premium-entry__note-icon {
  align-items: center;
  justify-content: center;
  aspect-ratio: 4 / 3;
  width: 100%;
  border-radius: 10px;
  background: var(--premium-soft);
  color: rgb(var(--v-theme-primary));
}

@container (max-width: 559px) {
  .premium-entry__main {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }

  .premium-entry__photo,
  .premium-entry__note-icon {
    width: 72px !important;
    flex-shrink: 0;
  }

  .premium-entry__menu {
    position: static !important;
    background: transparent !important;
    align-self: center;
  }
}
</style>
