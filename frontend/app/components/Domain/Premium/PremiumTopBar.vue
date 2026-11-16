<template>
  <v-app-bar
    flat
    :height="compact ? 60 : 76"
    class="premium-topbar d-print-none"
  >
    <RecipeDialogSearch ref="searchDialog" />

    <div
      class="d-flex align-center w-100 ga-3"
      :class="compact ? 'px-4' : 'px-8'"
    >
      <!-- Phone and tablet: compact brand, search icon -->
      <template v-if="compact">
        <PremiumBrand
          :to="homeLink"
          compact
        />
        <v-spacer />
        <v-btn
          icon
          variant="text"
          :aria-label="$t('search.search')"
          @click="openSearch"
        >
          <v-icon :icon="mdiMagnify" />
        </v-btn>
      </template>

      <!-- Desktop: wide search field and Add Recipe -->
      <template v-else>
        <button
          type="button"
          class="premium-search"
          @click="openSearch"
        >
          <v-icon
            :icon="mdiMagnify"
            size="20"
          />
          <span>{{ $t("premium.search-placeholder") }}</span>
          <kbd class="premium-search__key">/</kbd>
        </button>
        <v-spacer />
        <v-menu
          v-if="isOwnGroup && nav.create.length"
          location="bottom end"
          :offset="8"
        >
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              color="primary"
              variant="flat"
              rounded="pill"
              :prepend-icon="mdiPlus"
              class="text-none"
            >
              {{ $t("premium.add-recipe") }}
            </v-btn>
          </template>
          <v-list
            density="comfortable"
            min-width="280"
            class="premium-menu"
          >
            <v-list-item
              v-for="link in nav.create"
              :key="link.key"
              :to="link.to"
              :prepend-icon="link.icon"
              :title="link.title"
              :subtitle="link.subtitle"
            />
          </v-list>
        </v-menu>
      </template>

      <PremiumUserMenu :compact="compact" />
    </div>
  </v-app-bar>
</template>

<script setup lang="ts">
import { mdiMagnify, mdiPlus } from "@mdi/js";
import type RecipeDialogSearch from "~/components/Domain/Recipe/RecipeDialogSearch.vue";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { usePremiumNav } from "~/composables/use-premium-nav";

defineProps({
  compact: {
    type: Boolean,
    default: false,
  },
});

const { nav, groupSlug } = usePremiumNav();
const { isOwnGroup } = useLoggedInState();
const homeLink = computed(() => (groupSlug.value ? `/g/${groupSlug.value}` : "/"));

const searchDialog = ref<InstanceType<typeof RecipeDialogSearch> | null>(null);
function openSearch() {
  searchDialog.value?.open();
}

// Same "/" shortcut as Mealie's own header
function handleKeyEvent(e: KeyboardEvent) {
  const activeTag = document.activeElement?.tagName;
  if (e.key === "/" && activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
    e.preventDefault();
    openSearch();
  }
}
onMounted(() => document.addEventListener("keydown", handleKeyEvent));
onBeforeUnmount(() => document.removeEventListener("keydown", handleKeyEvent));
</script>

<style scoped>
.premium-search {
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(520px, 100%);
  height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba(var(--v-border-color), 0.14);
  background: rgb(var(--v-theme-surface));
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.95rem;
  text-align: left;
  cursor: text;
  transition: border-color 0.15s ease;
}

.premium-search:hover,
.premium-search:focus-visible {
  border-color: rgb(var(--v-theme-primary));
  outline: none;
}

.premium-search span {
  flex: 1;
}

.premium-search__key {
  font-family: inherit;
  font-size: 0.75rem;
  padding: 1px 7px;
  border-radius: 6px;
  border: 1px solid rgba(var(--v-border-color), 0.2);
}
</style>
