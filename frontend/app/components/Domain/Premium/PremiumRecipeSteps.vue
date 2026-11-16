<template>
  <!-- Instructions tab: numbered steps, linked ingredients, detected times -->
  <ol
    v-if="items.length"
    class="premium-steps"
  >
    <li
      v-for="item in items"
      :key="item.key"
      class="premium-step"
    >
      <h3
        v-if="item.step.title"
        class="premium-step__section"
      >
        {{ item.step.title }}
      </h3>
      <div class="premium-step__row">
        <span
          class="premium-step__num"
          aria-hidden="true"
        >{{ item.number }}</span>
        <div class="premium-step__body">
          <SafeMarkdown
            :source="item.step.text"
            class="premium-step__text"
          />
          <ul
            v-if="item.ingredients.length"
            class="premium-step__ingredients"
          >
            <li
              v-for="(ingredient, i) in item.ingredients"
              :key="i"
            >
              <RecipeIngredientListItem
                :ingredient="ingredient"
                :scale="scale"
              />
            </li>
          </ul>
          <div
            v-if="item.times.length"
            class="premium-step__times"
          >
            <button
              v-for="(time, i) in item.times"
              :key="i"
              type="button"
              class="premium-chip"
              :title="$t('premium.cook-from-step', [item.number])"
              @click="$emit('cook', item.index)"
            >
              <v-icon
                :icon="mdiTimerOutline"
                size="16"
              />
              {{ time }}
            </button>
          </div>
        </div>
      </div>
    </li>
  </ol>
  <p
    v-else
    class="text-medium-emphasis"
  >
    {{ $t("premium.no-steps") }}
  </p>
</template>

<script setup lang="ts">
import { mdiTimerOutline } from "@mdi/js";
import RecipeIngredientListItem from "~/components/Domain/Recipe/RecipeIngredientListItem.vue";
import { formatDurationLabel, parseDurations } from "~/composables/use-premium-timers";
import type { RecipeIngredient, RecipeStep } from "~/lib/api/types/recipe";

const props = withDefaults(defineProps<{
  steps: RecipeStep[];
  ingredients: RecipeIngredient[];
  scale?: number;
}>(), { scale: 1 });
defineEmits<{ cook: [stepIndex: number] }>();

/** Times found in a step: Mealie's own step duration first, then times written in the text. */
function stepTimes(step: RecipeStep): string[] {
  const labels: string[] = [];
  if (step.durationSeconds) labels.push(formatDurationLabel(step.durationSeconds));
  for (const t of parseDurations(step.text || "")) {
    const label = formatDurationLabel(t.minSeconds, t.maxSeconds);
    if (!labels.includes(label)) labels.push(label);
  }
  return labels;
}

const items = computed(() => props.steps
  .map((step, index) => ({ step, index }))
  .filter(({ step }) => (step.text || "").trim() || step.title)
  .map(({ step, index }, i) => {
    const refs = new Set((step.ingredientReferences || []).map(r => r.referenceId));
    return {
      key: step.id || `step-${index}`,
      step,
      index,
      number: i + 1,
      ingredients: props.ingredients.filter(ing => ing.referenceId && refs.has(ing.referenceId)),
      times: stepTimes(step),
    };
  }));
</script>

<style scoped>
.premium-steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.premium-step__section {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 1.15rem;
  margin: 6px 0 10px;
}

.premium-step__row {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.premium-step__num {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary));
}

.premium-step__body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.premium-step__text {
  font-size: 1.02rem;
  line-height: 1.6;
}

.premium-step__text :deep(p:last-child) {
  margin-bottom: 0;
}

.premium-step__ingredients {
  margin: 0;
  padding-left: 18px;
  font-size: 0.92rem;
  opacity: 0.85;
}

.premium-step__times {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
