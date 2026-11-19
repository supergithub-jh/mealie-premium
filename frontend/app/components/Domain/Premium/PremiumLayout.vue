<template>
  <v-app class="premium-app">
    <TheSnackbar />

    <!-- Sidebar first, so it runs the full height beside the top bar -->
    <PremiumSidebar v-if="!compact" />
    <PremiumTopBar :compact="compact" />

    <v-main class="premium-main">
      <PremiumAdminTabs v-if="isAdminPage" />
      <v-scroll-x-transition>
        <div>
          <NuxtPage />
        </div>
      </v-scroll-x-transition>
    </v-main>

    <PremiumBottomNav v-if="compact && loggedIn" />
  </v-app>
</template>

<script setup lang="ts">
import { useLoggedInState } from "~/composables/use-logged-in-state";

// Phones (also sideways) and portrait tablets (< 960px) get the tab bar; wider screens the sidebar.
// An explicit width, not Vuetify's "md" breakpoint, which starts at 840px and would give a
// sideways phone the desktop sidebar. Keep in step with the 959px rules in the Premium styles.
const PREMIUM_COMPACT_BELOW = 960;
const { width } = useDisplay();
const compact = computed(() => width.value < PREMIUM_COMPACT_BELOW);
const { loggedIn } = useLoggedInState();

// Admin pages (layouts/admin.vue also renders this layout) get the admin tab row
const route = useRoute();
const isAdminPage = computed(() => route.path.startsWith("/admin/") && route.path !== "/admin/setup");
</script>
