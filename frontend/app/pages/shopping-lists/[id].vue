<template>
  <PremiumShoppingList :id="id" />
</template>

<script setup lang="ts">
// Mealie Premium: the list page is PremiumShoppingList (v0.4.1). It uses Mealie's own
// useShoppingListPage for everything the list does; only the look is the fork's.
import PremiumShoppingList from "~/components/Domain/Premium/PremiumShoppingList.vue";

definePageMeta({
  middleware: ["auth"],
});

const i18n = useI18n();
useSeoMeta({
  title: i18n.t("shopping-list.shopping-list"),
});

const route = useRoute();
const id = route.params.id as string;
</script>
