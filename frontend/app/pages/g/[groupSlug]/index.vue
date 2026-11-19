<template>
  <div>
    <!-- Mealie Premium: Home has its own page; the recipe list moved to /g/<group>/recipes -->
    <PremiumHome v-if="showHome" />
    <RecipeExplorerPage v-else-if="!redirecting" />
  </div>
</template>

<script setup lang="ts">
import RecipeExplorerPage from "~/components/Domain/Recipe/RecipeExplorerPage/RecipeExplorerPage.vue";
import PremiumHome from "~/components/Domain/Premium/PremiumHome.vue";
import { useLoggedInState } from "~/composables/use-logged-in-state";

// Mealie links to filtered recipe lists as /g/<group>?tags=… (tag pages, recipe chips, data tables):
// send those to the Recipes page with the same filters. Visitors from outside the group keep the list.
const route = useRoute();
const router = useRouter();
const { isOwnGroup } = useLoggedInState();
const hasQuery = computed(() => Object.keys(route.query).length > 0);
const redirecting = computed(() => isOwnGroup.value && hasQuery.value);
const showHome = computed(() => isOwnGroup.value && !hasQuery.value);

watch(redirecting, (go) => {
  if (go) router.replace({ path: `/g/${route.params.groupSlug}/recipes`, query: route.query });
}, { immediate: true });
</script>
