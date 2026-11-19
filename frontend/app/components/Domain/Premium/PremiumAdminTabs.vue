<template>
  <!-- Admin sections as a tab row at the top of admin pages (scrolls sideways on phones) -->
  <nav
    v-if="nav.admin.length"
    class="premium-admin-tabs d-print-none"
    :aria-label="$t('settings.admin-settings')"
  >
    <v-tabs
      :model-value="activeKey"
      color="primary"
      show-arrows
      density="comfortable"
    >
      <v-tab
        v-for="link in nav.admin"
        :key="link.key"
        :value="link.key"
        :to="link.to"
        :prepend-icon="link.icon"
        class="text-none"
      >
        {{ link.title }}
      </v-tab>
    </v-tabs>
  </nav>
</template>

<script setup lang="ts">
import { usePremiumNav } from "~/composables/use-premium-nav";

const { nav, isActive } = usePremiumNav();
const activeKey = computed(() => nav.value.admin.find(link => isActive(link))?.key ?? null);
</script>

<style scoped>
.premium-admin-tabs {
  max-width: 1240px;
  margin: 8px auto 0;
  padding: 0 24px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

@media (max-width: 959px) {
  .premium-admin-tabs {
    padding: 0 8px;
  }
}
</style>
