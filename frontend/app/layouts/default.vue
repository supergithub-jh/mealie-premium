<template>
  <PremiumLayout />
</template>

<script setup lang="ts">
// Mealie Premium: own layout; upstream's DefaultLayout.vue is left untouched.
import PremiumLayout from "@/components/Domain/Premium/PremiumLayout.vue";
import { useGlobalI18n } from "~/composables/use-global-i18n";

useGlobalI18n(); // ensure i18n is initialized
</script>
