<template>
  <RouterLink
    :to="to"
    class="premium-brand"
    :class="{ 'premium-brand--compact': compact }"
  >
    <span class="premium-brand__mark">
      <img
        v-if="$appInfo.brandingLogoUrl"
        :src="$appInfo.brandingLogoUrl"
        alt=""
        width="36"
        height="36"
      >
      <v-icon
        v-else
        :size="compact ? 28 : 34"
        :icon="mdiChefHat"
      />
    </span>
    <span class="premium-brand__text">
      <span class="premium-brand__name">{{ $appInfo.brandingName }}</span>
      <span
        v-if="!compact"
        class="premium-brand__subtitle"
      >{{ $t("premium.digital-cookbook") }}</span>
      <span
        v-if="!compact && showVersion"
        class="premium-brand__version"
      >{{ versionLabel }}</span>
    </span>
  </RouterLink>
</template>

<script setup lang="ts">
import { mdiChefHat } from "@mdi/js";
import { premiumVersionLabel } from "~/premium-version";

defineProps({
  to: {
    type: String,
    default: "/",
  },
  compact: {
    type: Boolean,
    default: false,
  },
  showVersion: {
    type: Boolean,
    default: false,
  },
});

const versionLabel = premiumVersionLabel();
</script>

<style scoped>
.premium-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: inherit;
  text-decoration: none;
}

.premium-brand__mark {
  display: inline-flex;
  color: rgb(var(--v-theme-primary));
}

.premium-brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  min-width: 0;
}

.premium-brand__name {
  font-family: "Playfair Display", Georgia, serif;
  font-weight: 700;
  font-size: 1.28rem;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.premium-brand--compact .premium-brand__name {
  font-size: 1.2rem;
}

.premium-brand__subtitle {
  font-size: 0.85rem;
  opacity: 0.75;
}

.premium-brand__version {
  font-size: 0.7rem;
  opacity: 0.6;
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}
</style>
