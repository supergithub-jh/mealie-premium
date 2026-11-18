<template>
  <!-- Mealie Premium Cook mode: one step at a time, timers, screen kept awake. -->
  <v-theme-provider :theme="isDark ? 'dark' : 'light'">
    <div
      class="premium-cook"
      :class="isDark ? 'v-theme--dark' : 'v-theme--light'"
      role="dialog"
      aria-modal="true"
      :aria-label="$t('premium.cook-mode')"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <!-- Running timers, pinned above everything while you move between steps -->
      <div
        v-if="timers.length"
        class="premium-cook__timers"
      >
        <div
          v-for="timer in timers"
          :key="timer.id"
          class="premium-cook__timer"
          :class="{ 'is-done': timer.finished, 'is-paused': timer.endsAt === null && !timer.finished }"
          role="timer"
        >
          <v-icon
            :icon="timer.finished ? mdiBellRing : mdiTimerOutline"
            size="20"
          />
          <span class="premium-cook__timer-label">{{ timer.label }}</span>
          <span class="premium-cook__timer-time">{{ timer.finished ? $t("premium.timer-done") : formatCountdown(remainingMs(timer, now)) }}</span>
          <v-btn
            v-if="!timer.finished"
            icon
            size="small"
            variant="text"
            :aria-label="timer.endsAt === null ? $t('premium.resume') : $t('premium.pause')"
            @click="timer.endsAt === null ? resume(timer.id) : pause(timer.id)"
          >
            <v-icon :icon="timer.endsAt === null ? mdiPlay : mdiPause" />
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            class="text-none px-2"
            @click="addMinute(timer.id)"
          >
            {{ $t("premium.plus-minute") }}
          </v-btn>
          <v-btn
            icon
            size="small"
            variant="text"
            :aria-label="$t('premium.dismiss')"
            @click="remove(timer.id)"
          >
            <v-icon :icon="mdiClose" />
          </v-btn>
        </div>
      </div>

      <header class="premium-cook__top">
        <v-btn
          icon
          variant="tonal"
          :aria-label="$t('premium.exit-cook-mode')"
          @click="exit"
        >
          <v-icon :icon="mdiClose" />
        </v-btn>
        <div class="premium-cook__title">
          <div class="premium-cook__name">
            {{ recipe.name }}
          </div>
          <div
            v-if="servings"
            class="premium-cook__sub"
          >
            {{ $t("premium.serves", [servings]) }}
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          :aria-label="isDark ? $t('settings.theme.light-mode') : $t('settings.theme.dark-mode')"
          :title="isDark ? $t('settings.theme.light-mode') : $t('settings.theme.dark-mode')"
          @click="toggleTheme"
        >
          <v-icon :icon="isDark ? mdiWeatherSunny : mdiWeatherNight" />
        </v-btn>
        <div
          v-if="steps.length"
          class="premium-cook__count"
        >
          {{ $t("premium.step-of", [current + 1, steps.length]) }}
        </div>
      </header>

      <div
        v-if="steps.length > 1"
        class="premium-cook__progress"
      >
        <button
          v-for="(s, i) in steps"
          :key="s.key"
          type="button"
          class="premium-cook__segment"
          :class="{ 'is-done': i <= current }"
          :aria-label="$t('premium.step-of', [i + 1, steps.length])"
          :aria-current="i === current ? 'step' : undefined"
          @click="current = i"
        />
      </div>

      <main
        v-if="step"
        class="premium-cook__step"
      >
        <h2
          v-if="step.raw.title"
          class="premium-cook__section"
        >
          {{ step.raw.title }}
        </h2>
        <SafeMarkdown
          :source="step.raw.text"
          class="premium-cook__text"
        />

        <div class="premium-cook__actions">
          <v-btn
            v-for="(t, i) in step.times"
            :key="i"
            variant="outlined"
            color="primary"
            size="large"
            :prepend-icon="mdiTimerOutline"
            class="text-none"
            @click="openTimerSheet(t)"
          >
            {{ $t("premium.start-timer") }} · {{ formatDurationLabel(t.minSeconds, t.maxSeconds) }}
          </v-btn>
          <v-btn
            variant="text"
            size="large"
            :prepend-icon="mdiPlus"
            class="text-none"
            @click="openTimerSheet(null)"
          >
            {{ $t("premium.add-timer") }}
          </v-btn>
        </div>

        <div
          v-if="step.ingredients.length"
          class="premium-cook__for-step"
        >
          <div class="premium-cook__label">
            {{ $t("premium.for-this-step") }}
          </div>
          <div class="d-flex flex-wrap ga-2">
            <span
              v-for="(text, i) in step.ingredients"
              :key="i"
              class="premium-chip premium-chip--large"
            >{{ text }}</span>
          </div>
        </div>
      </main>
      <main
        v-else
        class="premium-cook__step"
      >
        <p class="premium-cook__text">
          {{ $t("premium.no-steps") }}
        </p>
      </main>

      <footer class="premium-cook__nav">
        <v-btn
          icon
          size="x-large"
          variant="tonal"
          :disabled="current === 0"
          :aria-label="$t('premium.previous-step')"
          @click="go(-1)"
        >
          <v-icon :icon="mdiChevronLeft" />
        </v-btn>
        <v-btn
          variant="text"
          size="large"
          :prepend-icon="mdiFormatListBulleted"
          class="text-none"
          @click="ingredientsOpen = true"
        >
          {{ $t("recipe.ingredients") }}
        </v-btn>
        <v-btn
          v-if="current < steps.length - 1"
          icon
          size="x-large"
          color="primary"
          variant="flat"
          :aria-label="$t('premium.next-step')"
          @click="go(1)"
        >
          <v-icon :icon="mdiChevronRight" />
        </v-btn>
        <v-btn
          v-else
          size="x-large"
          color="primary"
          variant="flat"
          class="text-none"
          @click="finish"
        >
          {{ $t("premium.finish") }}
        </v-btn>
      </footer>
      <div class="premium-cook__awake">
        <v-icon
          :icon="wakeLock.isActive.value ? mdiWhiteBalanceSunny : mdiSleep"
          size="14"
        />
        {{ wakeLock.isActive.value ? $t("premium.screen-awake") : $t("premium.screen-may-sleep") }}
      </div>

      <!-- Full ingredient checklist (ticks shared with the recipe page) -->
      <v-bottom-sheet
        v-model="ingredientsOpen"
        :max-width="640"
        scrollable
      >
        <v-card class="premium-cook__sheet">
          <v-card-title class="d-flex align-center ga-2 flex-wrap pt-4">
            <span class="premium-cook__sheet-title">{{ $t("recipe.ingredients") }}</span>
            <v-spacer />
            <RecipePageScale
              v-model="scale"
              :recipe="recipe"
              class="premium-cook__scale"
            />
          </v-card-title>
          <v-card-text>
            <RecipeIngredients
              :value="recipe.recipeIngredient"
              :scale="scale"
              :storage-key="ingredientStorageKey"
              is-cook-mode
            />
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-btn
              block
              size="large"
              color="primary"
              variant="flat"
              class="text-none"
              @click="ingredientsOpen = false"
            >
              {{ steps.length ? $t("premium.back-to-step", [current + 1]) : $t("general.close") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-bottom-sheet>

      <!-- Set a timer: pre-filled from the step, always adjustable -->
      <v-dialog
        v-model="timerSheet.open"
        max-width="420"
      >
        <v-card class="pa-2">
          <v-card-title class="premium-cook__sheet-title pt-3">
            {{ $t("premium.set-timer") }}
          </v-card-title>
          <v-card-text class="d-flex flex-column ga-4">
            <div
              v-if="timerSheet.picks.length > 1"
              class="d-flex ga-2 flex-wrap"
            >
              <v-btn
                v-for="pick in timerSheet.picks"
                :key="pick"
                :variant="pick === sheetSeconds ? 'flat' : 'outlined'"
                color="primary"
                class="text-none"
                @click="setPick(pick)"
              >
                {{ formatDurationLabel(pick) }}
              </v-btn>
            </div>
            <div class="d-flex align-center ga-2">
              <v-text-field
                v-model.number="timerSheet.hours"
                type="number"
                inputmode="numeric"
                min="0"
                :label="$t('premium.timer-hours')"
                hide-details
                density="comfortable"
                class="premium-cook__time-field"
              />
              <v-text-field
                v-model.number="timerSheet.minutes"
                type="number"
                inputmode="numeric"
                min="0"
                max="59"
                :label="$t('premium.timer-minutes')"
                hide-details
                density="comfortable"
                class="premium-cook__time-field"
              />
              <v-text-field
                v-model.number="timerSheet.seconds"
                class="premium-cook__time-field"
                type="number"
                inputmode="numeric"
                min="0"
                max="59"
                :label="$t('premium.timer-seconds')"
                hide-details
                density="comfortable"
              />
            </div>
            <div class="d-flex ga-2">
              <v-btn
                variant="tonal"
                class="text-none flex-grow-1"
                :prepend-icon="mdiMinus"
                @click="nudge(-60)"
              >
                {{ $t("premium.minus-minute") }}
              </v-btn>
              <v-btn
                variant="tonal"
                class="text-none flex-grow-1"
                :prepend-icon="mdiPlus"
                @click="nudge(60)"
              >
                {{ $t("premium.plus-minute") }}
              </v-btn>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn
              variant="text"
              class="text-none"
              @click="timerSheet.open = false"
            >
              {{ $t("general.cancel") }}
            </v-btn>
            <v-spacer />
            <v-btn
              color="primary"
              variant="flat"
              size="large"
              class="text-none"
              :disabled="sheetSeconds <= 0"
              @click="startFromSheet"
            >
              {{ $t("premium.start") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </v-theme-provider>
</template>

<script setup lang="ts">
import {
  mdiBellRing,
  mdiChevronLeft,
  mdiChevronRight,
  mdiClose,
  mdiFormatListBulleted,
  mdiMinus,
  mdiPause,
  mdiPlay,
  mdiPlus,
  mdiSleep,
  mdiTimerOutline,
  mdiWeatherNight,
  mdiWeatherSunny,
  mdiWhiteBalanceSunny,
} from "@mdi/js";
import { useWakeLock } from "@vueuse/core";
import { useTheme } from "vuetify";
import RecipeIngredients from "~/components/Domain/Recipe/RecipeIngredients.vue";
import RecipePageScale from "~/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageScale.vue";
import { useIngredientTextParser } from "~/composables/recipes";
import { PageMode, usePageState } from "~/composables/recipe-page/shared-state";
import { COOK_THEME_KEY, cookStepStorageKey, type CookTheme } from "~/composables/use-premium-cook";
import { formatQuantity } from "~/composables/use-premium-quantity";
import {
  type DetectedTime,
  formatCountdown,
  formatDurationLabel,
  parseDurations,
  remainingMs,
  usePremiumTimers,
} from "~/composables/use-premium-timers";
import type { RecipeOut } from "~/lib/api/types/recipe";

const props = defineProps<{
  /** The recipe as displayed (unit conversion applied) */
  recipe: RecipeOut;
  ingredientStorageKey: string;
}>();
const scale = defineModel<number>("scale", { default: 1 });

const i18n = useI18n();
const { setMode } = usePageState(props.recipe.slug);
const { parseIngredientText } = useIngredientTextParser();
const { timers, now, start, pause, resume, addMinute, remove } = usePremiumTimers();

// ------------------------------------------------------------ steps
const steps = computed(() => (props.recipe.recipeInstructions || [])
  .map((raw, index) => ({ raw, index }))
  .filter(({ raw }) => (raw.text || "").trim())
  .map(({ raw, index }) => {
    const refs = new Set((raw.ingredientReferences || []).map(r => r.referenceId));
    const times: DetectedTime[] = [];
    if (raw.durationSeconds) {
      times.push({ text: "", minSeconds: raw.durationSeconds, maxSeconds: raw.durationSeconds });
    }
    for (const t of parseDurations(raw.text || "")) {
      if (!times.some(x => x.minSeconds === t.minSeconds && x.maxSeconds === t.maxSeconds)) times.push(t);
    }
    return {
      key: raw.id || `step-${index}`,
      index,
      raw,
      times,
      ingredients: props.recipe.recipeIngredient
        .filter(ing => ing.referenceId && refs.has(ing.referenceId))
        .map(ing => parseIngredientText(ing, scale.value, false)),
    };
  }));

const storageKey = cookStepStorageKey(props.recipe);
function initialStep(): number {
  try {
    const saved = Number(localStorage.getItem(storageKey));
    // Saved value is the recipe's own step index; find its position among the steps shown
    const pos = steps.value.findIndex(s => s.index === saved);
    return pos >= 0 ? pos : 0;
  }
  catch { return 0; }
}
const current = ref(initialStep());
const step = computed(() => steps.value[current.value]);
watch(current, () => {
  try { localStorage.setItem(storageKey, String(step.value?.index ?? 0)); }
  catch { /* not saved */ }
});

function go(delta: number) {
  const next = current.value + delta;
  if (next >= 0 && next < steps.value.length) current.value = next;
}

function exit() {
  setMode(PageMode.VIEW);
}

function finish() {
  try { localStorage.removeItem(storageKey); }
  catch { /* ignore */ }
  exit();
}

const servings = computed(() => {
  const base = props.recipe.recipeServings || 0;
  return base ? formatQuantity(base * scale.value) : "";
});

// ------------------------------------------------------------ theme (Cook mode only)
const appTheme = useTheme();
const cookTheme = ref<CookTheme>("auto");
try {
  const saved = localStorage.getItem(COOK_THEME_KEY) as CookTheme | null;
  if (saved === "light" || saved === "dark") cookTheme.value = saved;
}
catch { /* default */ }
const isDark = computed(() => (cookTheme.value === "auto" ? appTheme.current.value.dark : cookTheme.value === "dark"));
function toggleTheme() {
  cookTheme.value = isDark.value ? "light" : "dark";
  try { localStorage.setItem(COOK_THEME_KEY, cookTheme.value); }
  catch { /* not saved */ }
}

// ------------------------------------------------------------ timers
const timerSheet = reactive({ open: false, hours: 0, minutes: 5, seconds: 0, picks: [] as number[], label: "" });
const sheetSeconds = computed(() => (Number(timerSheet.hours) || 0) * 3600 + (Number(timerSheet.minutes) || 0) * 60 + (Number(timerSheet.seconds) || 0));

function setPick(total: number) {
  timerSheet.hours = Math.floor(total / 3600);
  timerSheet.minutes = Math.floor((total % 3600) / 60);
  timerSheet.seconds = total % 60;
}

function openTimerSheet(t: DetectedTime | null) {
  const stepNo = current.value + 1;
  if (t) {
    setPick(t.minSeconds);
    timerSheet.picks = t.minSeconds === t.maxSeconds ? [t.minSeconds] : [t.minSeconds, t.maxSeconds];
    timerSheet.label = `${formatDurationLabel(t.minSeconds, t.maxSeconds)}`;
  }
  else {
    setPick(300);
    timerSheet.picks = [];
    timerSheet.label = "";
  }
  const stepLabel = i18n.t("premium.timer-step-label", [stepNo]);
  timerSheet.label = timerSheet.label ? `${stepLabel} · ${timerSheet.label}` : stepLabel;
  timerSheet.open = true;
}

function nudge(delta: number) {
  setPick(Math.max(0, sheetSeconds.value + delta));
}

function startFromSheet() {
  if (sheetSeconds.value <= 0) return;
  start(timerSheet.label, sheetSeconds.value, current.value + 1);
  timerSheet.open = false;
}

// ------------------------------------------------------------ ingredients panel
const ingredientsOpen = ref(false);

// ------------------------------------------------------------ swipe and keys
let touch: { x: number; y: number } | null = null;
function onTouchStart(e: TouchEvent) {
  const t = e.touches[0];
  touch = t ? { x: t.clientX, y: t.clientY } : null;
}
function onTouchEnd(e: TouchEvent) {
  const t = e.changedTouches[0];
  if (!touch || !t || ingredientsOpen.value || timerSheet.open) return;
  const dx = t.clientX - touch.x;
  const dy = t.clientY - touch.y;
  touch = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
}

function onKey(e: KeyboardEvent) {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || ingredientsOpen.value || timerSheet.open) return;
  if (e.key === "ArrowRight") go(1);
  else if (e.key === "ArrowLeft") go(-1);
  else if (e.key === "Escape") exit();
}

// ------------------------------------------------------------ screen wake lock
const wakeLock = useWakeLock();

// The app's bars stay in the page behind Cook mode: take them out of keyboard and screen reader reach
const BEHIND = ".premium-topbar, .premium-sidebar, .premium-bottom-nav";
function setBehindInert(on: boolean) {
  document.querySelectorAll(BEHIND).forEach(el => el.toggleAttribute("inert", on));
}

onMounted(() => {
  window.addEventListener("keydown", onKey);
  document.documentElement.classList.add("premium-cook-open");
  setBehindInert(true);
  if (wakeLock.isSupported.value) {
    wakeLock.request("screen").catch(() => { /* refused: the status line says so */ });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  document.documentElement.classList.remove("premium-cook-open");
  setBehindInert(false);
  if (wakeLock.isActive.value) wakeLock.release().catch(() => {});
});
</script>

<style scoped>
.premium-cook {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
  padding: env(safe-area-inset-top, 0px) max(16px, env(safe-area-inset-right, 0px)) env(safe-area-inset-bottom, 0px)
    max(16px, env(safe-area-inset-left, 0px));
}

/* Cook mode carries its own theme class, so its own choice wins over the app's */
.premium-cook.v-theme--light {
  background: var(--cookbook-ivory);
}

.premium-cook > * {
  width: 100%;
  max-width: 820px;
  margin-left: auto;
  margin-right: auto;
}

.premium-cook__timers {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
}

.premium-cook__timer {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 52px;
  padding: 4px 6px 4px 14px;
  border-radius: 16px;
  background: rgba(var(--v-theme-primary), 0.14);
}

.premium-cook__timer.is-paused {
  opacity: 0.75;
}

.premium-cook__timer.is-done {
  background: rgb(var(--v-theme-warning));
  color: rgb(var(--v-theme-on-warning));
}

.premium-cook__timer-label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.premium-cook__timer-time {
  font-size: 1.5rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.premium-cook__top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0 12px;
}

.premium-cook__title {
  flex: 1 1 auto;
  min-width: 0;
}

.premium-cook__name {
  font-family: "Playfair Display", Georgia, serif;
  font-weight: 700;
  font-size: 1.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.premium-cook__sub {
  font-size: 0.82rem;
  opacity: 0.7;
}

.premium-cook__count {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  white-space: nowrap;
}

.premium-cook__progress {
  display: flex;
  gap: 6px;
}

.premium-cook__segment {
  flex: 1 1 0;
  height: 6px;
  border: 0;
  padding: 0;
  border-radius: 3px;
  background: rgba(var(--v-theme-on-background), 0.14);
  cursor: pointer;
}

.premium-cook__segment.is-done {
  background: rgb(var(--v-theme-primary));
}

.premium-cook__step {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px 0 12px;
}

.premium-cook__section {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 1.3rem;
  margin: 0;
}

.premium-cook__text {
  font-size: clamp(1.45rem, 3.4vw, 1.9rem);
  line-height: 1.4;
  font-weight: 500;
}

.premium-cook__text :deep(p:last-child) {
  margin-bottom: 0;
}

.premium-cook__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.premium-cook__for-step {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.premium-cook__label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.7;
}

.premium-cook__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0 8px;
}

.premium-cook__awake {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.75rem;
  opacity: 0.6;
  padding-bottom: 14px;
}

.premium-cook__scale {
  font-size: 1rem;
  line-height: 1.5;
}

.premium-cook__time-field {
  flex: 1 1 0;
  min-width: 0;
}

.premium-cook__sheet-title {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 1.3rem;
}
</style>
