<template>
  <v-bottom-navigation
    grow
    :height="64"
    color="primary"
    :model-value="activeKey"
    class="premium-bottom-nav d-print-none"
    :aria-label="$t('premium.main-navigation')"
  >
    <!--
      Buttons navigate on click instead of using `to`: until phase 4, Home and
      Recipes open the same page, and router links would light up both tabs.
    -->
    <v-btn
      v-for="link in nav.tabs"
      :key="link.key"
      :value="link.key"
      :aria-current="link.key === activeKey ? 'page' : undefined"
      class="text-none"
      @click="router.push(link.to)"
    >
      <v-icon :icon="link.icon" />
      <span>{{ link.shortTitle || link.title }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
import { usePremiumNav } from "~/composables/use-premium-nav";

const router = useRouter();
const { nav, isActive } = usePremiumNav();
const activeKey = computed(() => nav.value.tabs.find(link => isActive(link))?.key ?? null);
</script>
