// Mealie Premium: one menu definition shared by the sidebar, the phone tab bar
// and the profile menu. Deliberately independent of Mealie's DefaultLayout logic;
// it only relies on page addresses (checked by use-premium-nav.test.ts) and the
// cookbook store.
import {
  mdiAutoFix,
  mdiBookOpenPageVariantOutline,
  mdiCalendarMonthOutline,
  mdiCartOutline,
  mdiHomeOutline,
  mdiLayersOutline,
  mdiLinkVariant,
  mdiMagnify,
  mdiPotSteamOutline,
  mdiShapeOutline,
  mdiSilverwareForkKnife,
  mdiSquareEditOutline,
  mdiTagMultipleOutline,
  mdiTimelineText,
  mdiTrayArrowDown,
} from "@mdi/js";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { useGroupSelf } from "~/composables/use-groups";
import { useCookbookStore } from "~/composables/store/use-cookbook-store";

export interface PremiumNavLink {
  key: string;
  title: string;
  /** Shorter label for the phone tab bar */
  shortTitle?: string;
  subtitle?: string;
  icon: string;
  to: string;
  /** Only shown to members of the group (not on public pages) */
  restricted: boolean;
  /** Which page addresses count as "this item is active" */
  match?: (path: string) => boolean;
}

export interface PremiumNav {
  sidebar: PremiumNavLink[];
  tabs: PremiumNavLink[];
  more: PremiumNavLink[];
  create: PremiumNavLink[];
}

type Translate = (key: string) => string;

/** Pure menu definition, so it can be tested without a running app. */
export function buildPremiumNav(groupSlug: string, t: Translate, opts: { aiImport: boolean }): PremiumNav {
  const g = `/g/${groupSlug}`;
  const startsWith = (prefix: string) => (path: string) => path === prefix || path.startsWith(`${prefix}/`);

  // Phase 4 gives Home its own page; until then it opens the recipe list.
  const home: PremiumNavLink = {
    key: "home",
    title: t("general.home"),
    icon: mdiHomeOutline,
    to: g,
    restricted: false,
    match: path => path === g || path === `${g}/`,
  };
  const recipes: PremiumNavLink = {
    key: "recipes",
    title: t("general.recipes"),
    icon: mdiSilverwareForkKnife,
    to: g,
    restricted: false,
    match: path => path.startsWith(`${g}/r/`) && !path.startsWith(`${g}/r/create`),
  };
  const collections: PremiumNavLink = {
    key: "collections",
    title: t("premium.collections"),
    icon: mdiLayersOutline,
    to: `${g}/cookbooks`,
    restricted: true,
    match: startsWith(`${g}/cookbooks`),
  };
  const planner: PremiumNavLink = {
    key: "planner",
    title: t("meal-plan.meal-planner"),
    shortTitle: t("premium.planner"),
    icon: mdiCalendarMonthOutline,
    to: "/household/mealplan/planner/view",
    restricted: true,
    match: startsWith("/household/mealplan"),
  };
  const list: PremiumNavLink = {
    key: "list",
    title: t("premium.shopping-list"),
    shortTitle: t("premium.list"),
    icon: mdiCartOutline,
    to: "/shopping-lists",
    restricted: true,
    match: startsWith("/shopping-lists"),
  };
  const importLink: PremiumNavLink = {
    key: "import",
    title: t("general.import"),
    icon: mdiTrayArrowDown,
    to: `${g}/r/create/url`,
    restricted: true,
    match: startsWith(`${g}/r/create`),
  };

  const more: PremiumNavLink[] = [
    { key: "finder", title: t("recipe-finder.recipe-finder"), icon: mdiMagnify, to: `${g}/recipes/finder`, restricted: false },
    { key: "timeline", title: t("recipe.timeline"), icon: mdiTimelineText, to: `${g}/recipes/timeline`, restricted: true },
    { key: "categories", title: t("sidebar.categories"), icon: mdiShapeOutline, to: `${g}/recipes/categories`, restricted: true },
    { key: "tags", title: t("sidebar.tags"), icon: mdiTagMultipleOutline, to: `${g}/recipes/tags`, restricted: true },
    { key: "tools", title: t("tool.tools"), icon: mdiPotSteamOutline, to: `${g}/recipes/tools`, restricted: true },
  ];

  const create: PremiumNavLink[] = [
    {
      key: "create-url",
      title: t("general.import"),
      subtitle: t("new-recipe.import-by-url"),
      icon: mdiLinkVariant,
      to: `${g}/r/create/url`,
      restricted: true,
    },
    ...(opts.aiImport
      ? [{
          key: "create-ai",
          title: t("recipe.import-with-ai"),
          subtitle: t("recipe.import-with-ai-subtitle"),
          icon: mdiAutoFix,
          to: `${g}/r/create/ai`,
          restricted: true,
        }]
      : []),
    {
      key: "create-new",
      title: t("general.create"),
      subtitle: t("new-recipe.create-manually"),
      icon: mdiSquareEditOutline,
      to: `${g}/r/create/new`,
      restricted: true,
    },
  ];

  return {
    sidebar: [home, recipes, collections, planner, list, importLink],
    tabs: [home, recipes, planner, list, collections],
    more,
    create,
  };
}

export function usePremiumNav() {
  const i18n = useI18n();
  const auth = useMealieAuth();
  const route = useRoute();
  const { isOwnGroup } = useLoggedInState();
  const { group } = useGroupSelf();

  const groupSlug = computed(() => (route.params.groupSlug as string) || auth.user.value?.groupSlug || "");
  const aiImport = computed(() => !!group.value?.aiProviderSettings?.aiEnabled);

  const nav = computed(() => {
    const all = buildPremiumNav(groupSlug.value, key => i18n.t(key), { aiImport: aiImport.value });
    const allowed = (link: PremiumNavLink) => !link.restricted || isOwnGroup.value;
    return {
      sidebar: all.sidebar.filter(allowed),
      tabs: all.tabs.filter(allowed),
      more: all.more.filter(allowed),
      create: all.create.filter(allowed),
    };
  });

  // The household's collections (Mealie "cookbooks"), shown under Collections.
  const cookbookStore = isOwnGroup.value ? useCookbookStore(i18n) : null;
  const collections = computed<PremiumNavLink[]>(() => {
    const items = cookbookStore?.store.value || [];
    return [...items]
      .filter(cb => !auth.user.value?.householdId || cb.householdId === auth.user.value.householdId)
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map(cb => ({
        key: `collection-${cb.slug}`,
        title: cb.name,
        icon: mdiBookOpenPageVariantOutline,
        to: `/g/${groupSlug.value}/cookbooks/${cb.slug || ""}`,
        restricted: true,
      }));
  });

  function isActive(link: PremiumNavLink): boolean {
    return link.match ? link.match(route.path) : route.path === link.to;
  }

  return { nav, collections, groupSlug, isActive };
}
