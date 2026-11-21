<template>
  <!-- Mealie Premium shopping list (v0.4.1). All the list logic (saving, offline queue, sorting, labels,
       copy, recipe links, search) is Mealie's own useShoppingListPage; this is the look: items grouped by
       aisle label, big tick boxes, a tick stays crossed out for a few seconds (tap again to undo) before
       the item moves to "Done", item editor in a panel, recipes beside the list on wide screens. -->
  <div
    v-if="shoppingList"
    class="premium-list"
  >
    <!-- Title, counts, actions -->
    <header class="premium-list__head">
      <div class="premium-list__title-block">
        <NuxtLink
          to="/shopping-lists?disableRedirect=true"
          class="premium-list__back"
        >
          <v-icon :icon="mdiChevronLeft" size="18" />{{ $t("shopping-list.all-lists") }}
        </NuxtLink>
        <h1 class="premium-list__title">
          {{ shoppingList.name }}
        </h1>
        <div class="premium-list__muted">
          {{ $t("premium.list-counts", [openCount, doneCount]) }}
        </div>
      </div>
      <div class="premium-list__actions">
        <v-btn
          v-if="canSearch || isSearchOpen"
          icon
          variant="text"
          :color="isSearchOpen ? 'primary' : undefined"
          :aria-label="$t('search.search')"
          @click="toggleSearch"
        >
          <v-icon :icon="mdiMagnify" />
        </v-btn>
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              variant="outlined"
              color="primary"
              class="text-none"
              :prepend-icon="mdiContentCopy"
            >
              {{ $t("premium.copy-list") }}
            </v-btn>
          </template>
          <v-list class="premium-menu">
            <v-list-item
              :title="$t('shopping-list.copy-as-text')"
              @click="copyListItems('plain')"
            />
            <v-list-item
              :title="$t('shopping-list.copy-as-markdown')"
              @click="copyListItems('markdown')"
            />
          </v-list>
        </v-menu>
        <v-btn
          v-if="!compact"
          variant="outlined"
          color="primary"
          class="text-none"
          :prepend-icon="mdiTagOutline"
          @click="toggleReorderLabelsDialog()"
        >
          {{ $t("premium.labels") }}
        </v-btn>
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon
              variant="tonal"
              :aria-label="$t('premium.more-actions')"
            >
              <v-icon :icon="mdiDotsHorizontal" />
            </v-btn>
          </template>
          <v-list class="premium-menu">
            <v-list-item
              :prepend-icon="mdiCheckboxMultipleMarkedOutline"
              :title="$t('shopping-list.check-all-items')"
              :disabled="isSearching"
              @click="openCheckAllNow"
            />
            <v-list-item
              v-if="compact"
              :prepend-icon="mdiTagArrowUpOutline"
              :title="$t('shopping-list.reorder-labels')"
              @click="toggleReorderLabelsDialog()"
            />
            <v-list-item
              :prepend-icon="mdiTagMultipleOutline"
              :title="$t('shopping-list.manage-labels')"
              to="/group/data/labels"
            />
          </v-list>
        </v-menu>
      </div>
    </header>
    <div
      class="premium-list__progress"
      role="progressbar"
      :aria-valuenow="progress"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="$t('premium.list-counts', [openCount, doneCount])"
    >
      <div :style="{ width: `${progress}%` }" />
    </div>

    <BannerWarning
      v-if="isOffline"
      :title="$t('shopping-list.you-are-offline')"
      :description="$t('shopping-list.you-are-offline-description')"
    />

    <div class="premium-list__layout">
      <section class="premium-list__card premium-list__main">
        <v-text-field
          v-if="isSearchOpen"
          :model-value="search"
          :label="$t('search.search')"
          :prepend-inner-icon="mdiMagnify"
          autofocus
          clearable
          hide-details
          density="compact"
          variant="outlined"
          rounded="pill"
          class="mb-2"
          @update:model-value="value => search = value ?? ''"
          @click:clear="clearSearch"
        />

        <!-- Add: inline at the top on wide screens; on phones Mealie's add form sits at the bottom,
             just above the tab bar -->
        <ShoppingListQuickAdd
          v-if="!compact"
          v-model="createListItemData"
          class="premium-list__quick-add"
          :foods="allFoods || []"
          :labels="allLabels || []"
          :units="allUnits || []"
          @save="createListItem"
        />

        <p
          v-if="!openCount && !doneCount"
          class="premium-list__empty"
        >
          {{ $t("premium.list-empty") }}
        </p>

        <template
          v-for="(items, label) in itemsByLabel"
          :key="label"
        >
          <div
            v-if="hasMatches(items)"
            class="premium-list__group"
          >
            <h2 class="premium-list__group-head">
              <span
                class="premium-list__dot"
                :style="{ background: getLabelColor(label) || 'rgba(var(--v-theme-on-surface), 0.3)' }"
                aria-hidden="true"
              />
              <span class="premium-list__group-name">{{ label }}</span>
              <span class="premium-list__muted premium-list__group-count">{{ $t("premium.to-buy", [items.length]) }}</span>
            </h2>
            <VueDraggable
              :model-value="items"
              handle=".premium-item__drag"
              :delay="250"
              :delay-on-touch-only="true"
              :disabled="isSearching"
              @start="loadingCounter += 1"
              @end="loadingCounter -= 1"
              @update:model-value="updateIndexUncheckedByLabel(label.toString(), $event)"
            >
              <div
                v-for="item in items"
                v-show="matchesSearch(item)"
                :key="item.id"
                class="premium-item"
                :class="{ 'premium-item--pending': isPending(item.id) }"
              >
                <button
                  type="button"
                  class="premium-item__tick"
                  :aria-pressed="isPending(item.id)"
                  :aria-label="(isPending(item.id) ? $t('premium.untick') : $t('premium.tick')) + ' ' + itemName(item)"
                  @click="tick(item)"
                >
                  <span class="premium-item__box">
                    <v-icon
                      v-if="isPending(item.id)"
                      :icon="mdiCheck"
                      size="18"
                    />
                  </span>
                </button>
                <button
                  type="button"
                  class="premium-item__text"
                  :aria-label="$t('premium.edit-item', [itemName(item)])"
                  @click="openEditor(item)"
                >
                  <RecipeIngredientListItem :ingredient="item" />
                </button>
                <span
                  v-if="isPending(item.id)"
                  class="premium-item__undo"
                  aria-live="polite"
                >{{ $t("premium.tap-to-undo") }}</span>
                <v-icon
                  v-else-if="!compact && !isSearching"
                  :icon="mdiDragVertical"
                  class="premium-item__drag"
                  :aria-label="$t('premium.drag-to-reorder')"
                />
              </div>
            </VueDraggable>
          </div>
        </template>

        <!-- Done -->
        <div
          v-if="listItems.checked && hasMatches(listItems.checked)"
          class="premium-list__done"
        >
          <button
            type="button"
            class="premium-list__done-head"
            :aria-expanded="showDone"
            @click="showDone = !showDone"
          >
            <span class="font-weight-bold">{{ $t("premium.done") }}</span>
            <span class="premium-list__muted">{{ visibleCheckedCount }}</span>
            <span class="premium-list__done-toggle">{{ showDone ? $t("premium.hide") : $t("premium.show") }}</span>
          </button>
          <div v-if="showDone">
            <div
              v-for="item in listItems.checked"
              v-show="matchesSearch(item)"
              :key="item.id"
              class="premium-item premium-item--done"
            >
              <button
                type="button"
                class="premium-item__tick"
                :aria-label="$t('premium.untick') + ' ' + itemName(item)"
                @click="untick(item)"
              >
                <span class="premium-item__box premium-item__box--on">
                  <v-icon :icon="mdiCheck" size="18" />
                </span>
              </button>
              <div class="premium-item__text premium-item__text--static">
                <RecipeIngredientListItem :ingredient="item" />
              </div>
            </div>
            <div class="premium-list__done-actions">
              <v-btn
                variant="text"
                color="primary"
                class="text-none"
                :disabled="isSearching"
                @click="openUncheckAll"
              >
                {{ $t("shopping-list.uncheck-all-items") }}
              </v-btn>
              <v-btn
                variant="text"
                color="error"
                class="text-none"
                :disabled="isSearching"
                @click="openDeleteChecked"
              >
                {{ $t("premium.remove-ticked") }}
              </v-btn>
            </div>
          </div>
        </div>

        <p
          v-if="!hasSearchResults"
          class="premium-list__empty"
        >
          {{ $t("search.no-results") }}
        </p>
      </section>

      <!-- Recipes on this list -->
      <aside
        v-if="recipeList.length"
        class="premium-list__card premium-list__recipes"
        :aria-label="$t('premium.recipes-on-list')"
      >
        <h2 class="premium-list__h2">
          {{ $t("premium.recipes-on-list") }}
        </h2>
        <div class="premium-list__recipe-row">
          <div
            v-for="(recipe, index) in recipeList"
            :key="recipe.id"
            class="premium-list__recipe"
          >
            <NuxtLink
              :to="`/g/${groupSlug}/r/${recipe.slug}`"
              class="premium-list__recipe-link"
            >
              <PremiumRecipeImage
                :recipe="recipe"
                compact
                class="premium-list__recipe-photo"
              />
              <span class="premium-list__recipe-name">{{ recipe.name }}</span>
            </NuxtLink>
            <div class="premium-list__recipe-qty">
              <v-btn
                icon
                size="small"
                variant="text"
                :disabled="isOffline"
                :aria-label="$t('premium.recipe-less', [recipe.name])"
                @click.prevent="removeRecipeReferenceToList(recipe.id!)"
              >
                <v-icon :icon="mdiMinus" />
              </v-btn>
              <span>×{{ shoppingList.recipeReferences?.[index]?.recipeQuantity ?? 1 }}</span>
              <v-btn
                icon
                size="small"
                variant="text"
                :disabled="isOffline"
                :aria-label="$t('premium.recipe-more', [recipe.name])"
                @click.prevent="addRecipeReferenceToList(recipe.id!)"
              >
                <v-icon :icon="mdiPlus" />
              </v-btn>
            </div>
          </div>
        </div>
        <p class="premium-list__muted premium-list__hint">
          {{ $t("premium.recipes-on-list-hint") }}
        </p>
      </aside>
    </div>

    <ShoppingListAddItemForm
      v-if="compact"
      v-model="createListItemData"
      :order="1"
      :labels="allLabels || []"
      :units="allUnits || []"
      :foods="allFoods || []"
      @save="createListItem"
    />
    <WakelockSwitch />
    <!-- Mealie's confirm, label and item dialogs (they open as overlays; kept last so they add no gap) -->
    <div class="premium-list__dialogs">
      <BaseDialog
        v-model="state.checkAllDialog"
        bottom-sheet
        :title="$t('general.confirm')"
        :icon="$globals.icons.checkboxMultipleMarkedOutline"
        can-confirm
        @confirm="checkAll"
      >
        <v-card-text>{{ $t('shopping-list.are-you-sure-you-want-to-check-all-items') }}</v-card-text>
      </BaseDialog>
      <BaseDialog
        v-model="state.uncheckAllDialog"
        bottom-sheet
        :title="$t('general.confirm')"
        :icon="$globals.icons.checkboxMultipleBlankOutline"
        can-confirm
        @confirm="uncheckAll"
      >
        <v-card-text>{{ $t('shopping-list.are-you-sure-you-want-to-uncheck-all-items') }}</v-card-text>
      </BaseDialog>
      <BaseDialog
        v-model="state.deleteCheckedDialog"
        bottom-sheet
        :title="$t('general.confirm')"
        :icon="$globals.icons.alertCircle"
        can-confirm
        @confirm="deleteChecked"
      >
        <v-card-text>{{ $t('shopping-list.are-you-sure-you-want-to-delete-checked-items') }}</v-card-text>
      </BaseDialog>
      <BaseDialog
        v-model="reorderLabelsDialog"
        :icon="$globals.icons.tagArrowUp"
        :title="$t('shopping-list.reorder-labels')"
        :submit-icon="$globals.icons.save"
        :submit-text="$t('general.save')"
        can-submit
        @submit="saveLabelOrder"
        @close="cancelLabelOrder"
      >
        <v-card
          height="fit-content"
          max-height="70vh"
          style="overflow-y: auto;"
        >
          <VueDraggable
            v-if="localLabels"
            v-model="localLabels"
            handle=".handle"
            :delay="250"
            :delay-on-touch-only="true"
            class="my-2"
            @update:model-value="updateLabelOrder"
          >
            <div
              v-for="(labelSetting, index) in localLabels"
              :key="labelSetting.id"
            >
              <MultiPurposeLabelSection
                v-model="localLabels[index]"
                use-color
              />
            </div>
          </VueDraggable>
        </v-card>
      </BaseDialog>

      <!-- Item editor: Mealie's editor in a panel (bottom sheet on phones) -->
      <v-dialog
        v-model="editor.open"
        :fullscreen="false"
        :max-width="compact ? undefined : 560"
        :class="{ 'premium-list__sheet': compact }"
        :transition="compact ? 'dialog-bottom-transition' : undefined"
        scrollable
      >
        <v-card class="premium-list__editor">
          <v-card-title class="premium-list__editor-title">
            {{ editorTitle }}
          </v-card-title>
          <v-card-text class="pa-2">
            <ShoppingListItemEditor
              v-if="editor.item"
              v-model="editor.item"
              :labels="allLabels || []"
              :units="allUnits || []"
              :foods="allFoods || []"
              @save="saveEdit"
              @cancel="editor.open = false"
              @delete="deleteEdit"
            />
          </v-card-text>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  mdiCheck,
  mdiCheckboxMultipleMarkedOutline,
  mdiChevronLeft,
  mdiContentCopy,
  mdiDotsHorizontal,
  mdiDragVertical,
  mdiMagnify,
  mdiMinus,
  mdiPlus,
  mdiTagArrowUpOutline,
  mdiTagMultipleOutline,
  mdiTagOutline,
} from "@mdi/js";
import { VueDraggable } from "vue-draggable-plus";
import PremiumRecipeImage from "./PremiumRecipeImage.vue";
import RecipeIngredientListItem from "~/components/Domain/Recipe/RecipeIngredientListItem.vue";
import MultiPurposeLabelSection from "~/components/Domain/ShoppingList/MultiPurposeLabelSection.vue";
import ShoppingListAddItemForm from "~/components/Domain/ShoppingList/ShoppingListAddItemForm.vue";
import ShoppingListItemEditor from "~/components/Domain/ShoppingList/ShoppingListItemEditor.vue";
import ShoppingListQuickAdd from "~/components/Domain/ShoppingList/ShoppingListQuickAdd.vue";
import { useShoppingListPage } from "~/composables/shopping-list-page/use-shopping-list-page";
import { useFoodStore, useLabelStore, useUnitStore } from "~/composables/store";
import { useDelayedCheck } from "~/composables/use-premium-delayed-check";
import { usePremiumListCount } from "~/composables/use-premium-list-count";
import { alert } from "~/composables/use-toast";
import type { ShoppingListItemOut } from "~/lib/api/types/household";

const props = defineProps<{ id: string }>();

const i18n = useI18n();
const auth = useMealieAuth();
const groupSlug = computed(() => auth.user.value?.groupSlug || "");
const { width } = useDisplay();
const compact = computed(() => width.value < 960); // same switch as the layout's tab bar

const page = useShoppingListPage(props.id);
const { store: allLabels } = useLabelStore();
const { store: allUnits } = useUnitStore();
const { store: allFoods } = useFoodStore();
const listCount = usePremiumListCount();

const {
  shoppingList,
  state,
  checkAll,
  uncheckAll,
  deleteChecked,
  reorderLabelsDialog,
  localLabels,
  saveLabelOrder,
  cancelLabelOrder,
  updateLabelOrder,
  openCheckAll,
  copyListItems,
  toggleReorderLabelsDialog,
  isOffline,
  createListItemData,
  createListItem,
  itemsByLabel,
  getLabelColor,
  loadingCounter,
  updateIndexUncheckedByLabel,
  saveListItem,
  deleteListItem,
  listItems,
  openUncheckAll,
  openDeleteChecked,
  recipeList,
  removeRecipeReferenceToList,
  addRecipeReferenceToList,
  search,
  isSearching,
  isSearchOpen,
  canSearch,
  toggleSearch,
  matchesSearch,
  hasMatches,
  clearSearch,
  visibleCheckedCount,
  hasSearchResults,
} = page;

// Mealie's own warning when changes couldn't be saved
watch(page.hasFailedWrites, (failed) => {
  if (failed) alert.error(i18n.t("shopping-list.changes-not-saved"));
});

// Ticking: crossed out in place for 4 seconds, then saved as checked (and moves to Done)
const { toggle: tick, isPending, flush } = useDelayedCheck<ShoppingListItemOut>((item) => {
  saveListItem({ ...item, checked: true });
  setTimeout(() => listCount.refresh(), 800);
});

function untick(item: ShoppingListItemOut) {
  saveListItem({ ...item, checked: false });
  setTimeout(() => listCount.refresh(), 800);
}

function openCheckAllNow() {
  flush();
  openCheckAll();
}

const openCount = computed(() => listItems.unchecked?.length ?? 0);
const doneCount = computed(() => listItems.checked?.length ?? 0);
const progress = computed(() => {
  const total = openCount.value + doneCount.value;
  return total ? Math.round((doneCount.value / total) * 100) : 0;
});
const showDone = ref(false);
// While searching, open Done so a ticked item can be found (as Mealie does)
watch(isSearching, (s) => {
  if (s) showDone.value = true;
});

function itemName(item: ShoppingListItemOut) {
  return item.food?.name || item.note || item.display || i18n.t("recipe.ingredient");
}

// Item editor
const editor = reactive({ open: false, item: null as ShoppingListItemOut | null });
const editorTitle = computed(() => (editor.item ? itemName(editor.item) : ""));
function openEditor(item: ShoppingListItemOut) {
  editor.item = JSON.parse(JSON.stringify(item));
  editor.open = true;
}
function saveEdit() {
  if (editor.item) saveListItem(editor.item);
  editor.open = false;
}
function deleteEdit() {
  if (editor.item) deleteListItem(editor.item);
  editor.open = false;
  setTimeout(() => listCount.refresh(), 800);
}

// New items change the badge too
watch(() => shoppingList.value?.listItems?.length, () => listCount.refresh());
</script>

<style scoped>
.premium-list {
  container-type: inline-size;
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px 32px 48px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.premium-list__muted {
  color: rgba(var(--v-theme-on-background), 0.72);
  font-size: 0.9rem;
}

.premium-list__head {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.premium-list__title-block {
  flex: 1;
  min-width: 0;
}

.premium-list__back {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.premium-list__title {
  margin: 0;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.premium-list__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.premium-list__progress {
  height: 6px;
  border-radius: 999px;
  background: var(--premium-soft);
  overflow: hidden;
}

.premium-list__progress > div {
  height: 100%;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  transition: width 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .premium-list__progress > div {
    transition: none;
  }
}

.premium-list__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

@container (min-width: 900px) {
  .premium-list__layout {
    grid-template-columns: minmax(0, 1fr) 300px;
  }
}

.premium-list__card {
  background: rgb(var(--v-theme-surface));
  border-radius: 20px;
  box-shadow: var(--cookbook-shadow, 0 4px 16px rgba(50, 44, 37, 0.06));
  padding: 16px 20px;
}

.v-theme--dark .premium-list__card {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.premium-list__main {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.premium-list__quick-add {
  margin-bottom: 4px;
}

.premium-list__empty {
  margin: 8px 0;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.premium-list__group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 0 4px 6px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
  font-size: 1rem;
  font-weight: 600;
  font-family: var(--cookbook-sans, "Inter", system-ui, sans-serif) !important;
  letter-spacing: normal;
}

.premium-list__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.premium-list__group-count {
  font-weight: 400;
  font-size: 0.82rem;
}

/* Items */
.premium-item {
  display: flex;
  align-items: center;
  gap: 2px;
  min-height: 52px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.06);
}

.premium-item__tick {
  touch-action: manipulation;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 12px;
}

.premium-item__tick:focus-visible,
.premium-item__text:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

.premium-item__box {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 2px solid rgb(var(--v-theme-primary));
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.premium-item--pending .premium-item__box,
.premium-item__box--on {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.premium-item__text {
  touch-action: manipulation;
  flex: 1;
  min-width: 0;
  min-height: 48px;
  display: flex;
  align-items: center;
  padding: 4px 4px 4px 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
}

.premium-item__text--static {
  cursor: default;
}

.premium-item--pending .premium-item__text,
.premium-item--done .premium-item__text {
  text-decoration: line-through;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.premium-item__undo {
  font-size: 0.8rem;
  color: rgb(var(--v-theme-primary));
  white-space: nowrap;
  padding-right: 4px;
}

.premium-item__drag {
  cursor: grab;
  opacity: 0;
  transition: opacity 0.15s;
}

.premium-item:hover .premium-item__drag,
.premium-item:focus-within .premium-item__drag {
  opacity: 0.55;
}

/* Done */
.premium-list__done-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 48px;
  padding: 0 4px;
  border: 0;
  border-top: 1px solid rgba(var(--v-border-color), 0.12);
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
}

.premium-list__done-toggle {
  margin-left: auto;
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  font-size: 0.9rem;
}

.premium-list__done-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 6px;
}

/* Recipes */
.premium-list__h2 {
  margin: 0 0 12px;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
}

.premium-list__recipe-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.premium-list__recipe {
  display: flex;
  align-items: center;
  gap: 8px;
}

.premium-list__recipe-link {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.premium-list__recipe-photo {
  width: 64px !important;
  flex-shrink: 0;
  border-radius: 10px !important;
}

.premium-list__recipe-photo :deep(.v-icon) {
  font-size: 22px !important;
}

.premium-list__recipe-name {
  font-family: "Playfair Display", Georgia, serif;
  font-weight: 600;
  line-height: 1.25;
}

.premium-list__recipe-link:hover .premium-list__recipe-name {
  text-decoration: underline;
}

.premium-list__recipe-qty {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
}

.premium-list__hint {
  margin: 12px 0 0;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--v-border-color), 0.12);
  font-size: 0.85rem;
  line-height: 1.5;
}

/* Phones and portrait tablets: room at the bottom for Mealie's add form above the tab bar */
@media (max-width: 959px) {
  .premium-list {
    padding: 4px 16px 120px;
    gap: 12px;
  }

  .premium-list__title {
    font-size: 1.75rem;
  }

  .premium-list__card {
    padding: 8px 12px 12px;
  }
}

/* Mealie's editor card draws a coloured bar down its left side; inside our panel it's just a form */
.premium-list__editor :deep(.v-card) {
  border: 0 !important;
  box-shadow: none !important;
}

.premium-list__editor-title::first-letter {
  text-transform: uppercase;
}

.premium-list__editor-title {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 1.35rem;
  padding: 16px 20px 0;
}
</style>

<style>
/* Item editor as a bottom sheet on phones */
.premium-list__sheet.v-dialog > .v-overlay__content {
  margin: 0;
  width: 100%;
  max-width: 100%;
  position: absolute;
  bottom: 0;
}

.premium-list__sheet .v-card {
  border-radius: 20px 20px 0 0 !important;
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
