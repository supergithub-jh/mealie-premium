<template>
  <v-bottom-navigation
    grow
    :height="64"
    color="primary"
    :model-value="activeKey"
    class="premium-bottom-nav d-print-none"
    :aria-label="$t('premium.main-navigation')"
  >
    <!-- Buttons navigate on click instead of using `to`, so only the matching tab lights up -->
    <v-btn
      v-for="link in nav.tabs"
      :key="link.key"
      :value="link.key"
      :aria-current="link.key === activeKey ? 'page' : undefined"
      class="text-none"
      @click="router.push(link.to)"
    >
      <v-badge
        v-if="link.key === 'list' && listBadge"
        :content="listBadge"
        color="primary"
        :aria-label="$t('premium.items-to-buy', [listCount])"
      >
        <v-icon :icon="link.icon" />
      </v-badge>
      <v-icon
        v-else
        :icon="link.icon"
      />
      <span>{{ link.shortTitle || link.title }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
import { usePremiumListCount } from "~/composables/use-premium-list-count";
import { usePremiumNav } from "~/composables/use-premium-nav";

const router = useRouter();
const { nav, isActive } = usePremiumNav();
const { badge: listBadge, count: listCount } = usePremiumListCount();
const activeKey = computed(() => nav.value.tabs.find(link => isActive(link))?.key ?? null);
</script>
