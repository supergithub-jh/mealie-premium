<template>
  <v-navigation-drawer
    permanent
    :width="264"
    class="premium-sidebar d-print-none"
    :border="0"
  >
    <div class="px-5 pt-6 pb-4">
      <PremiumBrand
        :to="homeLink"
        show-version
      />
    </div>

    <v-list
      nav
      class="premium-nav px-4"
      :aria-label="$t('premium.main-navigation')"
    >
      <v-list-item
        v-for="link in nav.sidebar"
        :key="link.key"
        :value="link.key"
        :to="link.to"
        :active="isActive(link)"
        :prepend-icon="link.icon"
        :title="link.title"
        rounded="lg"
        exact
      >
        <template
          v-if="link.key === 'list' && listBadge"
          #append
        >
          <span
            class="premium-badge"
            :aria-label="$t('premium.items-to-buy', [listCount])"
          >{{ listBadge }}</span>
        </template>
      </v-list-item>

      <v-list-group
        v-if="moreLinks.length"
        value="more"
        :fluid="true"
      >
        <template #activator="{ props: groupProps }">
          <v-list-item
            v-bind="groupProps"
            :prepend-icon="mdiDotsHorizontal"
            :title="$t('premium.more')"
            rounded="lg"
          />
        </template>
        <v-list-item
          v-for="link in moreLinks"
          :key="link.key"
          :value="link.key"
          :to="link.to"
          :active="isActive(link)"
          :prepend-icon="link.icon"
          :title="link.title"
          rounded="lg"
          density="compact"
          class="ml-2"
        />
      </v-list-group>
    </v-list>

    <template #append>
      <v-divider class="mx-6" />
      <v-list
        nav
        class="premium-nav px-4"
      >
        <!-- Settings menu: User Settings, Data Management, Admin Settings (by permission) -->
        <v-menu
          v-if="nav.settings.length"
          location="end bottom"
          :offset="12"
        >
          <template #activator="{ props: menuProps }">
            <v-list-item
              v-bind="menuProps"
              value="settings"
              :active="inSettings"
              :prepend-icon="mdiCogOutline"
              :title="$t('general.settings')"
              rounded="lg"
            />
          </template>
          <v-list
            density="comfortable"
            min-width="230"
            class="premium-menu"
          >
            <v-list-item
              v-for="link in nav.settings"
              :key="link.key"
              :to="link.to"
              :prepend-icon="link.icon"
              :title="link.title"
            />
          </v-list>
        </v-menu>
      </v-list>
      <svg
        class="premium-sidebar__leaf"
        viewBox="0 0 160 150"
        aria-hidden="true"
      >
        <path
          d="M10 145 C 50 115, 85 85, 140 20"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
        />
        <g fill="currentColor">
          <path d="M40 122 C 22 112, 18 92, 24 80 C 38 92, 44 106, 40 122 Z" />
          <path d="M44 120 C 60 126, 78 122, 86 112 C 70 104, 54 108, 44 120 Z" />
          <path d="M70 96 C 54 84, 54 64, 62 54 C 74 68, 76 82, 70 96 Z" />
          <path d="M74 94 C 92 98, 106 92, 112 80 C 96 74, 82 80, 74 94 Z" />
          <path d="M100 64 C 88 50, 90 32, 100 24 C 108 38, 108 52, 100 64 Z" />
          <path d="M104 62 C 120 62, 132 54, 136 42 C 120 40, 110 48, 104 62 Z" />
        </g>
      </svg>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { mdiCogOutline, mdiDotsHorizontal } from "@mdi/js";
import { usePremiumListCount } from "~/composables/use-premium-list-count";
import { usePremiumNav } from "~/composables/use-premium-nav";

const { nav, collections, groupSlug, isActive, inSettings } = usePremiumNav();

const { badge: listBadge, count: listCount } = usePremiumListCount();
const homeLink = computed(() => (groupSlug.value ? `/g/${groupSlug.value}` : "/"));
const moreLinks = computed(() => [...nav.value.more, ...collections.value]);
</script>

<style scoped>
.premium-sidebar__leaf {
  display: block;
  width: 150px;
  margin: 8px 0 0 12px;
  color: rgb(var(--v-theme-primary));
  opacity: 0.22;
}
</style>
