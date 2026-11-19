<template>
  <PremiumLayout />
</template>

<script setup lang="ts">
// Mealie Premium: admin pages use the fork's layout (same sidebar/top bar/tab bar as the rest of the
// app); the admin sections are a tab row at the top (PremiumAdminTabs, shown by PremiumLayout).
// Upstream's own admin layout (AppHeader + AppSidebar with admin links) is replaced here.
import PremiumLayout from "@/components/Domain/Premium/PremiumLayout.vue";
import { useGlobalI18n } from "~/composables/use-global-i18n";

useGlobalI18n(); // ensure i18n is initialized, as upstream's admin layout did
</script>
