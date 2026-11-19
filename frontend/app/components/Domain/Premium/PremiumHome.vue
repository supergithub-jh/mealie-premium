<template>
  <!-- Mealie Premium Home (phase 4): Recipe of the Week, Tonight, this week's dinners, Browse chips and
       recently added recipes. Data comes from Mealie's normal API; nothing is stored on the server. -->
  <div class="premium-home">
    <header class="premium-home__greeting">
      <h1 class="premium-home__h1">
        {{ $t(greetingKey(now.getHours())) }}
      </h1>
      <div class="premium-home__date">
        {{ todayLabel }}
      </div>
    </header>

    <div class="premium-home__hero">
      <!-- Recipe of the Week -->
      <article
        class="premium-home__card premium-rotw"
        :aria-label="$t('premium.recipe-of-the-week')"
      >
        <template v-if="rotw">
          <NuxtLink
            :to="recipeLink(rotw)"
            class="premium-rotw__media"
            tabindex="-1"
            aria-hidden="true"
          >
            <PremiumRecipeImage
              :recipe="rotw"
              class="premium-rotw__photo"
            />
          </NuxtLink>
          <div class="premium-rotw__body">
            <span class="premium-home__badge">{{ $t("premium.recipe-of-the-week") }}</span>
            <h2 class="premium-rotw__title">
              <NuxtLink :to="recipeLink(rotw)">
                {{ rotw.name }}
              </NuxtLink>
            </h2>
            <p
              v-if="rotw.description"
              class="premium-rotw__desc"
            >
              {{ rotw.description }}
            </p>
            <div class="premium-home__meta">
              <span v-if="timeOf(rotw)">
                <v-icon :icon="mdiClockOutline" size="16" /> {{ timeOf(rotw) }}
              </span>
              <span v-if="servingsOf(rotw)">
                <v-icon :icon="mdiAccountGroupOutline" size="16" /> {{ servingsOf(rotw) }}
              </span>
            </div>
            <div class="premium-home__buttons">
              <v-btn
                color="primary"
                variant="flat"
                class="text-none"
                :to="recipeLink(rotw)"
              >
                {{ $t("premium.open-recipe") }}
              </v-btn>
            </div>
          </div>
        </template>
        <div
          v-else-if="!loadingRotw"
          class="premium-home__empty"
        >
          {{ $t("premium.no-recipes-yet") }}
        </div>
        <v-skeleton-loader
          v-else
          type="image, article"
          class="premium-rotw__skeleton"
        />
      </article>

      <!-- Tonight (dinner only) -->
      <article
        class="premium-home__card premium-tonight"
        :aria-label="$t('premium.tonight')"
      >
        <div class="premium-home__head">
          <h2 class="premium-home__h2">
            {{ $t("premium.tonight") }}
          </h2>
          <span class="premium-home__muted">{{ $t("meal-plan.dinner") }}</span>
        </div>

        <template v-if="tonight">
          <component
            :is="tonight.recipe ? NuxtLink : 'div'"
            :to="tonight.recipe ? recipeLink(tonight.recipe) : undefined"
            class="premium-tonight__meal"
          >
            <PremiumRecipeImage
              v-if="tonight.recipe"
              :recipe="tonight.recipe"
              compact
              class="premium-tonight__photo"
            />
            <div class="premium-tonight__text">
              <div class="premium-tonight__name">
                {{ entryName(tonight) }}
              </div>
              <div
                v-if="tonight.recipe && timeOf(tonight.recipe)"
                class="premium-home__muted"
              >
                {{ timeOf(tonight.recipe) }}
              </div>
              <div
                v-if="tonightMore"
                class="premium-home__muted"
              >
                {{ $t("premium.more-planned", [tonightMore]) }}
              </div>
            </div>
          </component>
          <div class="premium-home__buttons premium-tonight__buttons">
            <v-btn
              v-if="tonight.recipe"
              color="primary"
              variant="flat"
              class="text-none flex-grow-1"
              :prepend-icon="mdiChefHat"
              :to="`${recipeLink(tonight.recipe)}?cook=true`"
            >
              {{ $t("premium.cook-mode") }}
            </v-btn>
            <v-btn
              variant="text"
              color="primary"
              class="text-none"
              to="/household/mealplan/planner/edit"
            >
              {{ $t("premium.change") }}
            </v-btn>
          </div>
        </template>

        <template v-else-if="!loadingPlan">
          <div class="premium-tonight__none">
            <div class="font-weight-medium">
              {{ $t("premium.nothing-planned") }}
            </div>
            <div class="premium-home__muted">
              {{ $t("premium.nothing-planned-hint") }}
            </div>
          </div>
          <div class="premium-home__buttons">
            <v-btn
              color="primary"
              variant="flat"
              class="text-none flex-grow-1"
              to="/household/mealplan/planner/edit"
            >
              {{ $t("premium.plan-tonight") }}
            </v-btn>
            <v-btn
              color="primary"
              variant="outlined"
              class="text-none flex-grow-1"
              :prepend-icon="mdiDiceMultipleOutline"
              :loading="surprising"
              @click="surpriseMe"
            >
              {{ $t("premium.surprise-me") }}
            </v-btn>
          </div>
        </template>
        <v-skeleton-loader
          v-else
          type="list-item-avatar-two-line"
        />
      </article>
    </div>

    <!-- This week (dinners) -->
    <section :aria-label="$t('premium.this-week')">
      <div class="premium-home__head">
        <h2 class="premium-home__h2">
          {{ $t("premium.this-week") }}
        </h2>
        <v-btn
          variant="text"
          color="primary"
          class="text-none"
          to="/household/mealplan/planner/view"
        >
          {{ $t("premium.open-planner") }}
        </v-btn>
      </div>
      <div class="premium-week">
        <NuxtLink
          v-for="day in week"
          :key="day.iso"
          :to="day.entry ? '/household/mealplan/planner/view' : '/household/mealplan/planner/edit'"
          class="premium-week__day"
          :class="{ 'premium-week__day--today': day.today }"
          :aria-current="day.today ? 'date' : undefined"
        >
          <div class="premium-week__top">
            <span>{{ day.today ? $t("premium.today") : day.weekday }}</span>
            <span class="premium-home__muted">{{ day.date }}</span>
          </div>
          <template v-if="day.entry">
            <PremiumRecipeImage
              v-if="day.entry.recipe"
              :recipe="day.entry.recipe"
              compact
              class="premium-week__photo"
            />
            <div class="premium-week__name">
              {{ entryName(day.entry) }}
            </div>
          </template>
          <div
            v-else
            class="premium-week__plan"
          >
            <v-icon :icon="mdiPlus" size="16" /> {{ $t("premium.plan") }}
          </div>
        </NuxtLink>
      </div>
    </section>

    <PremiumHomeChips
      :group-slug="groupSlug"
      :user-id="userId"
    />

    <!-- Recently added -->
    <section
      v-if="recent.length"
      :aria-label="$t('premium.recently-added')"
    >
      <div class="premium-home__head">
        <h2 class="premium-home__h2">
          {{ $t("premium.recently-added") }}
        </h2>
        <v-btn
          variant="text"
          color="primary"
          class="text-none"
          :to="`/g/${groupSlug}/recipes`"
        >
          {{ $t("premium.all-recipes") }}
        </v-btn>
      </div>
      <div class="premium-recent">
        <PremiumRecipeCard
          v-for="r in recent"
          :key="r.id"
          :recipe="r"
          compact
          class="premium-recent__card"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { mdiAccountGroupOutline, mdiChefHat, mdiClockOutline, mdiDiceMultipleOutline, mdiPlus } from "@mdi/js";
import PremiumHomeChips from "./PremiumHomeChips.vue";
import PremiumRecipeCard from "./PremiumRecipeCard.vue";
import PremiumRecipeImage from "./PremiumRecipeImage.vue";
import { NuxtLink } from "#components";
import { useUserApi } from "~/composables/api";
import { useHouseholdSelf } from "~/composables/use-households";
import { useRecipeTime } from "~/composables/recipes/use-recipe-time";
import { alert } from "~/composables/use-toast";
import {
  entriesOn,
  entryName,
  greetingKey,
  isoDay,
  RECIPE_OF_THE_WEEK_SLUG,
  weekDays,
  weeklyIndex,
  weekKey,
} from "~/composables/use-premium-home";
import type { PlanEntryOut } from "~/lib/api/types/meal-plan";
import type { RecipeSummary } from "~/lib/api/types/recipe";

const api = useUserApi();
const auth = useMealieAuth();
const route = useRoute();
const i18n = useI18n();
const { household } = useHouseholdSelf();
const { recipeTimeDisplay } = useRecipeTime();

const groupSlug = computed(() => (route.params.groupSlug as string) || auth.user.value?.groupSlug || "");
const userId = computed(() => auth.user.value?.id || "");

useSeoMeta({ title: i18n.t("general.home") });

const now = ref(new Date());
const todayLabel = computed(() => new Intl.DateTimeFormat(i18n.locale.value, { weekday: "long", day: "numeric", month: "long" }).format(now.value));

function recipeLink(r: Pick<RecipeSummary, "slug">) {
  return `/g/${groupSlug.value}/r/${r.slug}`;
}
function timeOf(r: RecipeSummary) {
  return recipeTimeDisplay(r.totalTimeSeconds, r.totalTime) || "";
}
function servingsOf(r: RecipeSummary) {
  return r.recipeServings ? i18n.t("premium.serves", [r.recipeServings]) : "";
}

// ---------------------------------------------------------------- Recipe of the Week
// The newest recipe tagged "Recipe of the Week" (the AI helper adds one weekly, phase 5); until such a
// tag exists, a pick from the household's recipes that stays the same all week.
const rotw = ref<RecipeSummary | null>(null);
const loadingRotw = ref(true);

async function loadRecipeOfTheWeek() {
  loadingRotw.value = true;
  try {
    const { data: tagPage } = await api.tags.getAll(1, -1);
    const tag = tagPage?.items?.find(t => t.slug === RECIPE_OF_THE_WEEK_SLUG);
    if (tag) {
      const { data } = await api.recipes.search({ tags: [tag.id], orderBy: "created_at", orderDirection: "desc", page: 1, perPage: 1 });
      if (data?.items?.[0]) {
        rotw.value = data.items[0];
        return;
      }
    }
    const { data: first } = await api.recipes.search({ page: 1, perPage: 1, orderBy: "created_at", orderDirection: "asc" });
    const index = weeklyIndex(weekKey(now.value), first?.total || 0);
    if (index < 0) return;
    const { data } = await api.recipes.search({ page: index + 1, perPage: 1, orderBy: "created_at", orderDirection: "asc" });
    rotw.value = data?.items?.[0] || null;
  }
  finally {
    loadingRotw.value = false;
  }
}

// ---------------------------------------------------------------- This week and Tonight
const entries = ref<PlanEntryOut[]>([]);
const loadingPlan = ref(true);
const days = computed(() => weekDays(now.value, household.value?.preferences?.firstDayOfWeek ?? 0));

async function loadPlan() {
  loadingPlan.value = true;
  try {
    const d = days.value;
    const { data } = await api.mealplans.getAll(1, -1, { start_date: isoDay(d[0]!), end_date: isoDay(d[6]!) });
    entries.value = data?.items || [];
  }
  finally {
    loadingPlan.value = false;
  }
}

const tonightAll = computed(() => entriesOn(entries.value, now.value, "dinner"));
const tonight = computed(() => tonightAll.value[0] || null);
const tonightMore = computed(() => Math.max(0, tonightAll.value.length - 1));

const week = computed(() => {
  const fmtDay = new Intl.DateTimeFormat(i18n.locale.value, { weekday: "short" });
  const fmtDate = new Intl.DateTimeFormat(i18n.locale.value, { day: "numeric" });
  const todayIso = isoDay(now.value);
  return days.value.map(day => ({
    iso: isoDay(day),
    weekday: fmtDay.format(day),
    date: fmtDate.format(day),
    today: isoDay(day) === todayIso,
    entry: entriesOn(entries.value, day, "dinner")[0] || null,
  }));
});

const surprising = ref(false);
async function surpriseMe() {
  surprising.value = true;
  try {
    const { data } = await api.mealplans.setRandom({ date: isoDay(now.value), entryType: "dinner" });
    if (!data) {
      alert.error(i18n.t("premium.surprise-failed"));
      return;
    }
    await loadPlan();
  }
  finally {
    surprising.value = false;
  }
}

// ---------------------------------------------------------------- Recently added
const recent = ref<RecipeSummary[]>([]);
async function loadRecent() {
  const { data } = await api.recipes.search({ page: 1, perPage: 10, orderBy: "created_at", orderDirection: "desc" });
  recent.value = data?.items || [];
}

onMounted(() => {
  loadRecipeOfTheWeek();
  loadRecent();
});
// The week depends on the household's first day, which may arrive after the page opens
watch(() => isoDay(days.value[0]!), () => loadPlan(), { immediate: true });
</script>

<style scoped>
.premium-home {
  max-width: 1280px;
  margin: 0 auto;
  padding: 8px 32px 48px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.premium-home__h1 {
  margin: 0;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 2.1rem;
  font-weight: 700;
  line-height: 1.2;
}

.premium-home__date,
.premium-home__muted {
  color: rgba(var(--v-theme-on-background), 0.72);
}

.premium-home__muted {
  font-size: 0.9rem;
}

.premium-home__date {
  margin-top: 4px;
}

:deep(.premium-home__head) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

:deep(.premium-home__h2) {
  margin: 0;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 1.4rem;
  font-weight: 600;
  line-height: 1.3;
}

.premium-home__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 24px;
}

.premium-home__card {
  background: rgb(var(--v-theme-surface));
  border-radius: 20px;
  box-shadow: var(--cookbook-shadow, 0 4px 16px rgba(50, 44, 37, 0.06));
  overflow: hidden;
}

.premium-home__badge {
  align-self: flex-start;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--premium-soft);
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.82rem;
  font-weight: 600;
}

.premium-home__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 0.9rem;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.premium-home__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}

.premium-home__buttons :deep(.v-btn) {
  min-height: 44px;
}

.premium-home__empty {
  padding: 32px;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

/* Recipe of the Week */
.premium-rotw {
  display: flex;
}

.premium-rotw__media {
  width: 52%;
  flex-shrink: 0;
  display: block;
}

/* Always 4:3 (owner's rule for recipe photos), at the top of the card */
.premium-rotw__media {
  align-self: flex-start;
}

.premium-rotw__photo {
  border-radius: 0 !important;
}

.premium-rotw__body {
  flex: 1;
  min-width: 0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.premium-rotw__title {
  margin: 0;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 1.65rem;
  line-height: 1.25;
}

.premium-rotw__title a {
  color: inherit;
  text-decoration: none;
}

.premium-rotw__title a:hover {
  text-decoration: underline;
}

.premium-rotw__desc {
  margin: 0;
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.72);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.premium-rotw__skeleton {
  width: 100%;
  background: transparent;
}

/* Tonight */
.premium-tonight {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.premium-tonight .premium-home__head {
  margin-bottom: 0;
}

.premium-tonight__meal {
  display: flex;
  align-items: center;
  gap: 14px;
  color: inherit;
  text-decoration: none;
}

.premium-tonight__photo {
  width: 128px !important;
  flex-shrink: 0;
  border-radius: 12px !important;
}

.premium-tonight__text {
  min-width: 0;
}

.premium-tonight__name {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.3;
}

.premium-tonight__none {
  flex: 1;
  border-radius: 14px;
  background: var(--premium-soft);
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

/* This week */
.premium-week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
}

.premium-week__day {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  box-shadow: var(--cookbook-shadow, 0 4px 16px rgba(50, 44, 37, 0.06));
  color: inherit;
  text-decoration: none;
  min-width: 0;
}

.premium-week__day:hover,
.premium-week__day:focus-visible {
  outline: 2px solid rgba(var(--v-theme-primary), 0.5);
  outline-offset: -2px;
}

.premium-week__day--today {
  outline: 2px solid rgb(var(--v-theme-primary)) !important;
  outline-offset: -2px;
}

.premium-week__top {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 600;
}

.premium-week__day--today .premium-week__top > span:first-child {
  color: rgb(var(--v-theme-primary));
}

.premium-week__photo {
  border-radius: 10px !important;
}

.premium-week__photo :deep(.v-icon) {
  font-size: 28px !important;
}

.premium-week__name {
  font-size: 0.85rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  padding-bottom: 1px;
}

.premium-week__plan {
  flex: 1;
  min-height: 72px;
  border-radius: 10px;
  border: 1.5px dashed rgba(var(--v-theme-primary), 0.5);
  color: rgb(var(--v-theme-primary));
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

/* Recently added */
.premium-recent {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.premium-recent__card:nth-child(n + 6) {
  display: none;
}

/* Tablets and phones (layout switches to the tab bar below 960px) */
@media (max-width: 959px) {
  .premium-home {
    padding: 4px 16px 32px;
    gap: 24px;
  }

  .premium-home__h1 {
    font-size: 1.75rem;
  }

  .premium-home__hero {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .premium-rotw {
    flex-direction: column;
  }

  .premium-rotw__media {
    width: 100%;
  }

  .premium-rotw__body {
    padding: 16px;
  }

  .premium-rotw__title {
    font-size: 1.35rem;
  }

  /* Sideways rows that scroll, edge to edge */
  .premium-week,
  .premium-recent {
    display: flex;
    overflow-x: auto;
    margin: 0 -16px;
    padding: 2px 16px 12px;
    scroll-padding-inline: 16px;
    scroll-snap-type: x proximity;
  }

  .premium-week__day {
    width: 116px;
    flex-shrink: 0;
    scroll-snap-align: start;
  }

  .premium-recent__card {
    width: 168px;
    flex-shrink: 0;
    scroll-snap-align: start;
  }

  .premium-recent__card:nth-child(n + 6) {
    display: flex;
  }
}

/* Sideways phones and small tablets: photo beside the text again */
@media (min-width: 600px) and (max-width: 959px) {
  .premium-rotw {
    flex-direction: row;
  }

  .premium-rotw__media {
    width: 48%;
  }
}
</style>
