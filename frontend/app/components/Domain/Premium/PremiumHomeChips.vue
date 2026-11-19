<template>
  <!-- Home › Browse: quick links to the Recipes page filtered by a tag, category or tool, or to Favourites.
       Picked automatically until the user edits them; edits are kept in this browser (owner's choice). -->
  <section
    class="premium-chips"
    :aria-label="$t('premium.browse')"
  >
    <div class="premium-home__head">
      <h2 class="premium-home__h2">
        {{ $t("premium.browse") }}
      </h2>
      <v-btn
        variant="text"
        color="primary"
        class="text-none"
        @click="dialog = true"
      >
        {{ $t("general.edit") }}
      </v-btn>
    </div>
    <div class="premium-chips__row">
      <NuxtLink
        v-for="chip in shown"
        :key="chipKey(chip)"
        :to="chipLink(chip, groupSlug, userId)"
        class="premium-chip premium-chip--large premium-chips__link"
      >
        <v-icon
          :icon="iconFor(chip)"
          size="16"
        />
        {{ labelFor(chip) }}
      </NuxtLink>
    </div>

    <v-dialog
      v-model="dialog"
      max-width="560"
      scrollable
    >
      <v-card class="premium-chips__dialog">
        <v-card-title class="premium-chips__dialog-title">
          {{ $t("premium.browse-chips") }}
        </v-card-title>
        <v-card-text>
          <p class="premium-chips__mode">
            {{ saved ? $t("premium.chips-own") : $t("premium.chips-auto") }}
          </p>

          <div class="premium-chips__label">
            {{ $t("premium.shown-on-home") }}
          </div>
          <div class="premium-chips__row mb-5">
            <span
              v-for="(chip, i) in shown"
              :key="chipKey(chip)"
              class="premium-chip premium-chip--large premium-chips__editing"
            >
              <v-icon
                :icon="iconFor(chip)"
                size="16"
              />
              {{ labelFor(chip) }}
              <v-btn
                icon
                size="small"
                variant="text"
                class="premium-chips__remove"
                :aria-label="$t('premium.remove-chip', [labelFor(chip)])"
                @click="remove(i)"
              >
                <v-icon :icon="mdiClose" size="16" />
              </v-btn>
            </span>
            <span
              v-if="!shown.length"
              class="premium-chips__empty"
            >{{ $t("premium.chips-none") }}</span>
          </div>

          <div class="premium-chips__label">
            {{ $t("premium.add-chips") }}
          </div>
          <v-text-field
            v-model="filter"
            :label="$t('general.filter')"
            :prepend-inner-icon="mdiMagnify"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            class="mb-3"
          />
          <p
            v-if="!addGroups.length"
            class="premium-chips__empty"
          >
            {{ filter ? $t("premium.chips-no-match") : $t("premium.chips-all-added") }}
          </p>
          <template
            v-for="group in addGroups"
            :key="group.kind"
          >
            <div class="premium-chips__group">
              {{ group.title }}
            </div>
            <div class="premium-chips__row mb-3">
              <button
                v-for="chip in group.items"
                :key="chipKey(chip)"
                type="button"
                class="premium-chips__add"
                @click="add(chip)"
              >
                <v-icon :icon="mdiPlus" size="16" />
                {{ labelFor(chip) }}
              </button>
            </div>
          </template>
        </v-card-text>
        <v-card-actions class="premium-chips__actions">
          <v-btn
            v-if="saved"
            rounded="pill"
            variant="text"
            color="primary"
            class="text-none"
            @click="reset"
          >
            {{ $t("premium.reset-automatic") }}
          </v-btn>
          <v-spacer />
          <v-btn
            rounded="pill"
            variant="flat"
            color="primary"
            class="text-none px-6"
            @click="dialog = false"
          >
            {{ $t("general.done") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<script setup lang="ts">
import { mdiClose, mdiHeartOutline, mdiMagnify, mdiPlus, mdiPotSteamOutline, mdiShapeOutline, mdiTagOutline } from "@mdi/js";
import { StorageSerializers, useLocalStorage } from "@vueuse/core";
import { useCategoryStore, useTagStore, useToolStore } from "~/composables/store";
import {
  autoChips,
  availableChips,
  chipKey,
  chipLink,
  PREMIUM_CHIPS_STORAGE_KEY,
  reconcileChips,
  type PremiumChip,
} from "~/composables/use-premium-home";

const props = defineProps<{ groupSlug: string; userId: string }>();
const i18n = useI18n();

const tags = useTagStore();
const categories = useCategoryStore();
const tools = useToolStore();
const organizers = computed(() => ({
  tags: tags.store.value,
  categories: categories.store.value,
  tools: tools.store.value,
}));
// The stores load in the background; until something has arrived, don't drop saved chips as "deleted"
const loaded = computed(() => !!(tags.store.value.length || categories.store.value.length || tools.store.value.length));

// null = automatic pick; a list = the user's own choice
const saved = useLocalStorage<PremiumChip[] | null>(PREMIUM_CHIPS_STORAGE_KEY, null, { serializer: StorageSerializers.object });

const shown = computed<PremiumChip[]>(() => {
  if (Array.isArray(saved.value)) {
    // Until the organizer lists have loaded, keep the saved names rather than dropping everything
    return loaded.value ? reconcileChips(saved.value, organizers.value) : saved.value;
  }
  return autoChips(organizers.value);
});

function labelFor(chip: PremiumChip) {
  return chip.kind === "favorites" ? i18n.t("general.favorites") : chip.name;
}
function iconFor(chip: PremiumChip) {
  return { favorites: mdiHeartOutline, tags: mdiTagOutline, categories: mdiShapeOutline, tools: mdiPotSteamOutline }[chip.kind];
}

function remove(index: number) {
  const next = [...shown.value];
  next.splice(index, 1);
  saved.value = next;
}
function add(chip: PremiumChip) {
  saved.value = [...shown.value, chip];
}
function reset() {
  saved.value = null;
}

const dialog = ref(false);
const filter = ref<string | null>("");
const addGroups = computed(() => {
  const q = (filter.value || "").trim().toLowerCase();
  const available = availableChips(shown.value, organizers.value)
    .filter(c => !q || labelFor(c).toLowerCase().includes(q));
  const titles = {
    favorites: i18n.t("general.favorites"),
    tags: i18n.t("tag.tags"),
    categories: i18n.t("category.categories"),
    tools: i18n.t("tool.tools"),
  };
  return (["favorites", "tags", "categories", "tools"] as const)
    .map(kind => ({ kind, title: titles[kind], items: available.filter(c => c.kind === kind) }))
    .filter(g => g.items.length);
});

const groupSlug = computed(() => props.groupSlug);
const userId = computed(() => props.userId);
</script>

<style scoped>
.premium-chips__row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.premium-chips__link {
  min-height: 40px;
  text-decoration: none;
  font-weight: 500;
  align-items: center;
}

.premium-chips__link:hover,
.premium-chips__link:focus-visible {
  outline: 2px solid rgba(var(--v-theme-primary), 0.5);
  outline-offset: 1px;
}

.premium-chips__dialog-title {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 1.4rem;
  padding: 20px 24px 4px;
}

.premium-chips__mode {
  margin: 0 0 16px;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.premium-chips__label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.72);
  margin-bottom: 8px;
}

.premium-chips__group {
  font-weight: 600;
  font-size: 0.9rem;
  margin: 4px 0 6px;
}

.premium-chips__editing {
  padding-right: 2px !important;
  align-items: center;
}

.premium-chips__remove {
  width: 36px !important;
  height: 36px !important;
}

.premium-chips__empty {
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.premium-chips__add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 36px;
  padding: 4px 14px;
  border: 1px dashed rgba(var(--v-theme-primary), 0.6);
  border-radius: 999px;
  background: transparent;
  color: rgb(var(--v-theme-primary));
  font: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}

.premium-chips__add:hover,
.premium-chips__add:focus-visible {
  background: rgba(var(--v-theme-primary), 0.08);
  outline: none;
}

.premium-chips__actions {
  padding: 8px 16px 16px;
}
</style>
