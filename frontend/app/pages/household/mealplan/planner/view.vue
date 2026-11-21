<template>
  <PremiumPlannerView
    :mealplans="mealplans"
    :actions="actions"
  />
</template>

<script setup lang="ts">
// Mealie Premium: the week view is PremiumPlannerView (day cards, v0.4.1). Upstream's view rendered
// MealPlanLayout + MealPlanDay + RecipeCardMobile here; editing is still upstream's planner/edit.
import PremiumPlannerView from "~/components/Domain/Premium/PremiumPlannerView.vue";
import type { MealsByDate, useMealplans } from "~/composables/use-group-mealplan";

defineProps<{
  mealplans: MealsByDate[];
  actions: ReturnType<typeof useMealplans>["actions"];
}>();
</script>
