<template>
  <!-- Recipe photo, or a designed placeholder when there is none or it fails to load -->
  <div
    class="premium-photo"
    :class="{ 'premium-photo--empty': !showPhoto }"
    :style="{ aspectRatio: aspect }"
  >
    <img
      v-if="showPhoto"
      :src="src"
      :alt="recipe.name || ''"
      loading="lazy"
      @error="failed = true"
    >
    <div
      v-else
      class="premium-photo__placeholder"
    >
      <svg
        class="premium-photo__leaf"
        viewBox="0 0 160 150"
        aria-hidden="true"
      >
        <path d="M10 145 C 50 115, 85 85, 140 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
        <g fill="currentColor">
          <path d="M40 122 C 22 112, 18 92, 24 80 C 38 92, 44 106, 40 122 Z" />
          <path d="M44 120 C 60 126, 78 122, 86 112 C 70 104, 54 108, 44 120 Z" />
          <path d="M70 96 C 54 84, 54 64, 62 54 C 74 68, 76 82, 70 96 Z" />
          <path d="M74 94 C 92 98, 106 92, 112 80 C 96 74, 82 80, 74 94 Z" />
          <path d="M100 64 C 88 50, 90 32, 100 24 C 108 38, 108 52, 100 64 Z" />
          <path d="M104 62 C 120 62, 132 54, 136 42 C 120 40, 110 48, 104 62 Z" />
        </g>
      </svg>
      <v-icon
        :icon="mdiChefHat"
        :size="compact ? 40 : 64"
        class="premium-photo__hat"
      />
      <span
        v-if="!compact"
        class="premium-photo__label"
      >{{ $t("premium.no-photo") }}</span>
      <v-btn
        v-if="canGenerate && !generating"
        size="small"
        color="primary"
        variant="flat"
        :prepend-icon="mdiAutoFix"
        class="text-none mt-2"
        @click="$emit('generate')"
      >
        {{ $t("premium.generate-image") }}
      </v-btn>
    </div>
    <!-- While the AI helper makes a photo (up to a minute) -->
    <div
      v-if="generating"
      class="premium-photo__busy"
      role="status"
      aria-live="polite"
    >
      <v-progress-circular
        indeterminate
        :size="compact ? 28 : 40"
        width="3"
      />
      <span v-if="!compact">{{ $t("premium.generating-image") }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mdiAutoFix, mdiChefHat } from "@mdi/js";
import { useStaticRoutes } from "~/composables/api";
import type { RecipeOut, RecipeSummary } from "~/lib/api/types/recipe";

const props = withDefaults(defineProps<{
  recipe: RecipeOut | RecipeSummary;
  imageKey?: number;
  aspect?: string;
  compact?: boolean;
  /** Show "Generate image with AI" on the placeholder (the parent checks the helper and permissions) */
  canGenerate?: boolean;
  generating?: boolean;
}>(), {
  imageKey: 1,
  aspect: "4 / 3",
  compact: false,
  canGenerate: false,
  generating: false,
});
defineEmits<{ generate: [] }>();

const { recipeImage } = useStaticRoutes();
const failed = ref(false);
const src = computed(() => recipeImage(props.recipe.id || "", props.recipe.image, props.imageKey));
const showPhoto = computed(() => !!props.recipe.image && !failed.value);
watch(src, () => { failed.value = false; });
</script>

<style scoped>
.premium-photo {
  position: relative;
  width: 100%;
  max-width: 100%;
  border-radius: 20px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.premium-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.premium-photo__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgb(var(--v-theme-primary));
}

.premium-photo--empty {
  background: var(--premium-soft);
}

.premium-photo__leaf {
  position: absolute;
  right: 6%;
  bottom: 4%;
  width: 34%;
  opacity: 0.25;
}

.premium-photo__hat {
  opacity: 0.85;
}

.premium-photo__busy {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  /* soft tint over a solid surface, so the placeholder underneath doesn't show through */
  background: linear-gradient(var(--premium-soft), var(--premium-soft)), rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
  text-align: center;
  padding: 16px;
}

.premium-photo__label {
  font-size: 0.85rem;
  opacity: 0.8;
}
</style>
