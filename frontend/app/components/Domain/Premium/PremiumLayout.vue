<template>
  <v-app class="premium-app">
    <TheSnackbar />

    <!-- Sidebar first, so it runs the full height beside the top bar -->
    <PremiumSidebar v-if="!compact" />
    <PremiumTopBar :compact="compact" />

    <v-main class="premium-main">
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

// Phones and portrait tablets (< 960px) get the tab bar; wider screens the sidebar.
const { mdAndUp } = useDisplay();
const compact = computed(() => !mdAndUp.value);
const { loggedIn } = useLoggedInState();
</script>
