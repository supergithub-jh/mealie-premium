<template>
  <!-- Mealie Premium recipe page (view mode). Editing still uses Mealie's own editor. -->
  <div class="premium-recipe d-print-none">
    <div class="premium-recipe__grid">
      <div class="premium-recipe__media">
        <PremiumRecipeImage
          :recipe="recipe"
          :image-key="imageKey"
          :can-generate="canEditRecipe"
        />
        <v-btn
          v-if="hasSteps"
          block
          size="large"
          color="primary"
          variant="flat"
          :prepend-icon="mdiChefHat"
          class="text-none mt-4"
          @click="startCook(0)"
        >
          {{ $t("premium.cook-mode") }}
        </v-btn>
      </div>

      <div class="premium-recipe__main">
        <header class="premium-recipe__header">
          <h1 class="premium-recipe__title">
            {{ recipe.name }}
          </h1>
          <div class="premium-recipe__meta">
            <RecipeRating
              :key="recipe.slug"
              :model-value="recipe.rating"
              :recipe-id="recipe.id"
              :slug="recipe.slug"
            />
            <span
              v-for="item in timeItems"
              :key="item.label"
              class="premium-recipe__meta-item"
            >
              <v-icon
                :icon="mdiClockOutline"
                size="16"
              />
              <span>{{ item.label }}: {{ item.value }}</span>
            </span>
            <span
              v-if="servings"
              class="premium-recipe__meta-item"
            >
              <v-icon
                :icon="mdiSilverwareForkKnife"
                size="16"
              />
              <span>{{ $t("premium.serves", [servings]) }}</span>
            </span>
          </div>
          <SafeMarkdown
            v-if="recipe.description"
            :source="recipe.description"
            class="premium-recipe__description"
          />
          <div class="premium-recipe__actions">
            <RecipeLastMade
              v-if="isOwnGroup"
              :recipe="recipe"
            />
            <div class="premium-recipe__action-group">
              <span class="premium-recipe__icon-btn">
                <RecipeFavoriteBadge
                  v-if="isOwnGroup"
                  show-always
                  :recipe-id="recipe.id"
                />
              </span>
              <v-btn
                v-if="isOwnGroup && canEditRecipe"
                variant="tonal"
                color="primary"
                :prepend-icon="mdiPencilOutline"
                class="text-none"
                @click="setMode(PageMode.EDIT)"
              >
                {{ $t("general.edit") }}
              </v-btn>
              <RecipeContextMenu
                class="premium-recipe__icon-btn"
                show-print
                :menu-top="false"
                :name="recipe.name"
                :slug="recipe.slug"
                :menu-icon="mdiDotsHorizontal"
                :card-menu="false"
                :recipe="recipe"
                :recipe-id="recipe.id"
                :recipe-scale="scale"
                :use-items="{
                  edit: false,
                  download: isOwnGroup,
                  downloadPdf: isOwnGroup,
                  duplicate: isOwnGroup,
                  mealplanner: isOwnGroup,
                  shoppingList: isOwnGroup,
                  print: true,
                  printPreferences: true,
                  share: isOwnGroup,
                  recipeActions: true,
                  delete: isOwnGroup,
                }"
                @print="printRecipe"
              />
            </div>
          </div>
        </header>

        <v-tabs
          v-model="tab"
          color="primary"
          class="premium-recipe__tabs"
        >
          <v-tab
            value="ingredients"
            class="text-none"
          >
            {{ $t("recipe.ingredients") }}
          </v-tab>
          <v-tab
            value="instructions"
            class="text-none"
          >
            {{ $t("recipe.instructions") }}
          </v-tab>
          <v-tab
            value="notes"
            class="text-none"
          >
            {{ $t("recipe.notes") }}
          </v-tab>
        </v-tabs>

        <v-window
          v-model="tab"
          class="premium-recipe__panel"
        >
          <v-window-item value="ingredients">
            <div class="d-flex align-center flex-wrap ga-2">
              <RecipePageScale
                v-model="scale"
                :recipe="recipe"
              />
              <v-spacer />
              <v-btn
                v-if="isOwnGroup && displayedRecipe.recipeIngredient.length"
                variant="text"
                color="primary"
                :prepend-icon="mdiCartPlus"
                class="text-none"
                :loading="shoppingLoading"
                @click="openShoppingList"
              >
                {{ $t("premium.add-to-shopping-list") }}
              </v-btn>
            </div>
            <RecipeIngredients
              :value="displayedRecipe.recipeIngredient"
              :scale="scale"
              :storage-key="ingredientStorageKey"
              is-cook-mode
            />
            <p
              v-if="!displayedRecipe.recipeIngredient.length"
              class="text-medium-emphasis"
            >
              {{ $t("premium.no-ingredients") }}
            </p>
            <div
              v-if="recipe.tools && recipe.tools.length"
              class="mt-6"
            >
              <h3 class="premium-recipe__subhead">
                {{ $t("tool.tools") }}
              </h3>
              <div class="d-flex flex-wrap ga-2">
                <span
                  v-for="tool in recipe.tools"
                  :key="tool.id"
                  class="premium-chip"
                >{{ tool.name }}</span>
              </div>
            </div>
          </v-window-item>

          <v-window-item value="instructions">
            <PremiumRecipeSteps
              :steps="recipe.recipeInstructions || []"
              :ingredients="displayedRecipe.recipeIngredient"
              :scale="scale"
              @cook="startCook"
            />
          </v-window-item>

          <v-window-item value="notes">
            <RecipeNotes
              v-if="recipe.notes && recipe.notes.length"
              v-model="recipe.notes"
              :edit="false"
            />
            <RecipeNutrition
              v-if="recipe.settings?.showNutrition && recipe.nutrition"
              v-model="recipe.nutrition"
              :edit="false"
              class="mt-4"
            />
            <RecipeAssets
              v-if="recipe.settings?.showAssets && recipe.assets && recipe.assets.length"
              v-model="recipe.assets"
              :slug="recipe.slug"
              :recipe-id="recipe.id"
              class="mt-4"
            />
            <RecipePageOrganizers
              v-model="recipe"
              class="mt-4"
              @item-selected="chipClicked"
            />
            <v-btn
              v-if="isHttpUrl(recipe.orgURL)"
              :href="recipe.orgURL || undefined"
              target="_blank"
              rel="noopener"
              variant="text"
              color="primary"
              :prepend-icon="mdiOpenInNew"
              class="text-none mt-2 px-0"
            >
              {{ $t("recipe.original-url") }}
            </v-btn>
            <p
              v-if="!hasNotesContent"
              class="text-medium-emphasis mt-2"
            >
              {{ $t("premium.no-notes") }}
            </p>
          </v-window-item>
        </v-window>
      </div>
    </div>

    <RecipePageComments
      v-if="!disableComments"
      v-model="recipe"
      class="mt-8"
    />

    <RecipeDialogAddToShoppingList
      v-if="shoppingLists"
      v-model="shoppingDialog"
      :recipes="[{ scale, ...recipe }]"
      :shopping-lists="shoppingLists"
      @list-created="addShoppingList"
    />
  </div>
  <RecipePrintContainer
    :recipe="displayedRecipe"
    :scale="scale"
  />
</template>

<script setup lang="ts">
import {
  mdiCartPlus,
  mdiChefHat,
  mdiClockOutline,
  mdiDotsHorizontal,
  mdiOpenInNew,
  mdiPencilOutline,
  mdiSilverwareForkKnife,
} from "@mdi/js";
import RecipeAssets from "~/components/Domain/Recipe/RecipeAssets.vue";
import RecipeContextMenu from "~/components/Domain/Recipe/RecipeContextMenu/RecipeContextMenu.vue";
import RecipeDialogAddToShoppingList from "~/components/Domain/Recipe/RecipeDialogAddToShoppingList.vue";
import RecipeFavoriteBadge from "~/components/Domain/Recipe/RecipeFavoriteBadge.vue";
import RecipeIngredients from "~/components/Domain/Recipe/RecipeIngredients.vue";
import RecipeLastMade from "~/components/Domain/Recipe/RecipeLastMade.vue";
import RecipeNotes from "~/components/Domain/Recipe/RecipeNotes.vue";
import RecipeNutrition from "~/components/Domain/Recipe/RecipeNutrition.vue";
import RecipeRating from "~/components/Domain/Recipe/RecipeRating.vue";
import RecipePrintContainer from "~/components/Domain/Recipe/RecipePrintContainer.vue";
import RecipePageComments from "~/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageComments.vue";
import RecipePageOrganizers from "~/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageOrganizers.vue";
import RecipePageScale from "~/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageScale.vue";
import { useUserApi } from "~/composables/api";
import { useRecipePermissions } from "~/composables/recipes";
import { useRecipeTime } from "~/composables/recipes/use-recipe-time";
import { PageMode, usePageState, usePageUser } from "~/composables/recipe-page/shared-state";
import { useAddToShoppingListDialog } from "~/composables/shopping-list-page/use-add-to-shopping-list-dialog";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { cookStepStorageKey } from "~/composables/use-premium-cook";
import { formatQuantity } from "~/composables/use-premium-quantity";
import type { HouseholdSummary } from "~/lib/api/types/household";
import type { CategoryOut, RecipeOut, TagOut, ToolOut } from "~/lib/api/types/recipe";

const recipe = defineModel<RecipeOut>({ required: true });
const scale = defineModel<number>("scale", { default: 1 });
defineProps<{
  displayedRecipe: RecipeOut;
  ingredientStorageKey: string;
  disableComments?: boolean;
}>();

const i18n = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useMealieAuth();
const { isOwnGroup } = useLoggedInState();
const { imageKey, setMode } = usePageState(recipe.value.slug);
const { recipeTimeDisplay } = useRecipeTime();

const tab = ref("ingredients");
const groupSlug = computed(() => (route.params.groupSlug as string) || auth.user.value?.groupSlug || "");
const hasSteps = computed(() => (recipe.value.recipeInstructions || []).some(s => (s.text || "").trim()));

// Edit permission, as Mealie's own recipe header works it out
const { user } = usePageUser();
const recipeHousehold = ref<HouseholdSummary>();
if (user?.id && recipe.value.householdId) {
  useUserApi().households.getOne(recipe.value.householdId).then(({ data }) => {
    recipeHousehold.value = data || undefined;
  });
}
const { canEditRecipe } = useRecipePermissions(recipe.value, recipeHousehold, user);

const timeItems = computed(() => {
  const r = recipe.value;
  return [
    { label: i18n.t("recipe.total-time"), value: recipeTimeDisplay(r.totalTimeSeconds, r.totalTime) },
    { label: i18n.t("recipe.prep-time"), value: recipeTimeDisplay(r.prepTimeSeconds, r.prepTime) },
    { label: i18n.t("recipe.perform-time"), value: recipeTimeDisplay(r.performTimeSeconds, r.performTime) },
  ].filter(item => item.value);
});

const servings = computed(() => {
  const base = recipe.value.recipeServings || 0;
  return base ? formatQuantity(base * scale.value) : "";
});

const hasNotesContent = computed(() => {
  const r = recipe.value;
  return !!(r.notes?.length || (r.settings?.showNutrition && r.nutrition) || r.tags?.length || r.recipeCategory?.length || r.tools?.length || isHttpUrl(r.orgURL));
});

function isHttpUrl(url?: string | null) {
  return !!url && /^https?:\/\//i.test(url);
}

function startCook(stepIndex: number) {
  try { localStorage.setItem(cookStepStorageKey(recipe.value), String(stepIndex)); }
  catch { /* storage blocked: start at the first step */ }
  setMode(PageMode.COOK);
}

function printRecipe() {
  window.print();
}

function chipClicked(item: TagOut | CategoryOut | ToolOut, itemType: string) {
  if (item.id) router.push(`/g/${groupSlug.value}?${itemType}=${item.id}`);
}

const { open: shoppingDialog, shoppingLists, getShoppingLists, addShoppingList } = useAddToShoppingListDialog();
const shoppingLoading = ref(false);
async function openShoppingList() {
  shoppingLoading.value = true;
  await getShoppingLists();
  shoppingLoading.value = false;
  shoppingDialog.value = true;
}
</script>

<style scoped>
.premium-recipe {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 32px 48px;
}

.premium-recipe__grid {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: 40px;
  align-items: start;
}

.premium-recipe__media {
  position: sticky;
  top: 96px;
}

.premium-recipe__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.premium-recipe__header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.premium-recipe__title {
  font-family: "Playfair Display", Georgia, serif;
  font-size: clamp(1.9rem, 3vw, 2.6rem);
  line-height: 1.12;
  margin: 0;
  text-wrap: balance;
}

.premium-recipe__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 18px;
  font-size: 0.92rem;
  opacity: 0.85;
}

.premium-recipe__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.premium-recipe__description {
  font-size: 1.02rem;
  line-height: 1.6;
}

.premium-recipe__description :deep(p:last-child) {
  margin-bottom: 0;
}

.premium-recipe__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.premium-recipe__action-group {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

/* Mealie's favourite and menu buttons, shown as plain outline icons like the mockup */
.premium-recipe__icon-btn :deep(.v-btn) {
  background: transparent !important;
  box-shadow: none !important;
}

.premium-recipe__icon-btn :deep(.v-btn .v-icon) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.premium-recipe__tabs {
  margin-top: 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.premium-recipe__panel {
  padding-top: 16px;
}

.premium-recipe__subhead {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 1.1rem;
  margin: 0 0 10px;
}

@media (max-width: 959px) {
  .premium-recipe {
    padding: 12px 16px 32px;
  }

  .premium-recipe__grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }

  .premium-recipe__media {
    position: static;
  }
}
</style>
