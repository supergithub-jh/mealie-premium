<template>
  <!-- Mealie Premium recipe card: 4:3 photo (or placeholder), title, time and stars. Used on Home and
       in the Recipes grid (RecipeCardSection). The whole card is one link; heart and menu sit on top. -->
  <article
    class="premium-card"
    :class="{ 'premium-card--compact': compact }"
  >
    <NuxtLink
      :to="recipeRoute"
      class="premium-card__link"
    >
      <PremiumRecipeImage
        :recipe="recipe"
        compact
        class="premium-card__photo"
      />
      <div class="premium-card__body">
        <h3 class="premium-card__title">
          {{ recipe.name }}
        </h3>
        <div
          v-if="time"
          class="premium-card__meta"
        >
          <v-icon
            :icon="mdiClockOutline"
            size="15"
          />
          {{ time }}
        </div>
      </div>
    </NuxtLink>
    <div
      v-if="isOwnGroup"
      class="premium-card__actions"
    >
      <RecipeCardRating
        v-if="!compact && recipe.rating"
        class="premium-card__rating"
        :model-value="recipe.rating"
        :recipe-id="recipe.id"
      />
      <v-spacer />
      <RecipeFavoriteBadge
        :recipe-id="recipe.id"
        show-always
      />
      <RecipeContextMenu
        v-if="!compact"
        :slug="recipe.slug"
        :menu-icon="$globals.icons.dotsVertical"
        :name="recipe.name"
        :recipe-id="recipe.id"
        :use-items="{
          delete: false,
          edit: false,
          download: true,
          downloadPdf: true,
          mealplanner: true,
          shoppingList: true,
          print: false,
          printPreferences: false,
          share: true,
        }"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
import { mdiClockOutline } from "@mdi/js";
import PremiumRecipeImage from "./PremiumRecipeImage.vue";
import RecipeCardRating from "~/components/Domain/Recipe/RecipeCardRating.vue";
import RecipeContextMenu from "~/components/Domain/Recipe/RecipeContextMenu/RecipeContextMenu.vue";
import RecipeFavoriteBadge from "~/components/Domain/Recipe/RecipeFavoriteBadge.vue";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { useRecipeTime } from "~/composables/recipes/use-recipe-time";
import type { RecipeSummary } from "~/lib/api/types/recipe";

const props = withDefaults(defineProps<{
  recipe: RecipeSummary;
  /** Smaller card for Home rows: no stars or menu */
  compact?: boolean;
}>(), { compact: false });

const route = useRoute();
const auth = useMealieAuth();
const { isOwnGroup } = useLoggedInState();
const { recipeTimeDisplay } = useRecipeTime();

const groupSlug = computed(() => (route.params.groupSlug as string) || auth.user.value?.groupSlug || "");
const recipeRoute = computed(() => `/g/${groupSlug.value}/r/${props.recipe.slug}`);
const time = computed(() => recipeTimeDisplay(props.recipe.totalTimeSeconds, props.recipe.totalTime) || "");
</script>

<style scoped>
.premium-card {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: var(--cookbook-radius, 16px);
  background: rgb(var(--v-theme-surface));
  box-shadow: var(--cookbook-shadow, 0 4px 16px rgba(50, 44, 37, 0.06));
  overflow: hidden;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.premium-card:hover {
  box-shadow: 0 8px 24px rgba(50, 44, 37, 0.12);
}

.premium-card__link {
  display: flex;
  flex-direction: column;
  flex: 1;
  color: inherit;
  text-decoration: none;
}

.premium-card__link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
  border-radius: inherit;
}

.premium-card__photo {
  border-radius: 0 !important;
}

.premium-card__body {
  padding: 12px 14px 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.premium-card__title {
  margin: 0;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 1.08rem;
  font-weight: 600;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  padding-bottom: 2px; /* room for descenders under the clamp */
}

.premium-card__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.premium-card__actions {
  display: flex;
  align-items: center;
  padding: 0 4px 4px 10px;
  min-height: 44px;
}

/* Mealie's favourite and menu buttons as plain outline icons (they default to filled Espresso) */
.premium-card__actions :deep(.v-btn) {
  background: transparent !important;
  box-shadow: none !important;
  width: 40px;
  height: 40px;
}

.premium-card__actions :deep(.v-btn .v-icon) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.premium-card__rating {
  font-size: 0.95rem;
}

.premium-card--compact .premium-card__title {
  font-size: 1rem;
}

.premium-card--compact .premium-card__actions {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 0;
  min-height: 0;
}

.premium-card--compact .premium-card__actions :deep(.v-btn) {
  background: rgba(var(--v-theme-surface), 0.92) !important;
}

.premium-card--compact .premium-card__body {
  padding-bottom: 12px;
}
</style>
