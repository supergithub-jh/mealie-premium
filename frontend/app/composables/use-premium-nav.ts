// Mealie Premium: one menu definition shared by the sidebar, the phone tab bar
// and the profile menu. Deliberately independent of Mealie's DefaultLayout logic;
// it only relies on page addresses (checked by use-premium-nav.test.ts) and the
// cookbook store.
import {
  mdiAccountCogOutline,
  mdiAccountGroupOutline,
  mdiAccountOutline,
  mdiAutoFix,
  mdiCogOutline,
  mdiDatabaseOutline,
  mdiHomeAccount,
  mdiTextSearch,
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
  mdiTableEdit,
  mdiTagMultipleOutline,
  mdiTimelineText,
  mdiTrayArrowDown,
  mdiWrenchOutline,
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
  /** Extra permission needed, on top of being logged in */
  requires?: "admin" | "organizer";
}

export interface PremiumNav {
  sidebar: PremiumNavLink[];
  tabs: PremiumNavLink[];
  more: PremiumNavLink[];
  create: PremiumNavLink[];
  /** The Settings menu (sidebar and profile menu), as in Mealie's own sidebar */
  settings: PremiumNavLink[];
  /** Admin sections, shown as a tab row at the top of admin pages */
  admin: PremiumNavLink[];
}

export interface PremiumNavUser {
  admin?: boolean;
  canOrganize?: boolean;
}

/** Whether a user may see a link that needs extra permission. */
export function hasPermission(link: PremiumNavLink, user: PremiumNavUser | null | undefined): boolean {
  if (link.requires === "admin") {
    return !!user?.admin;
  }
  if (link.requires === "organizer") {
    return !!user?.canOrganize;
  }
  return true;
}

/** Pages that count as "in Settings" for highlighting the sidebar item. */
export function isSettingsPath(path: string): boolean {
  return ["/user/profile", "/group", "/household", "/admin"].some(p => path === p || path.startsWith(`${p}/`))
    && !path.startsWith("/household/mealplan/planner");
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

  const settings: PremiumNavLink[] = [
    { key: "user-settings", title: t("profile.user-settings"), icon: mdiAccountCogOutline, to: "/user/profile", restricted: false },
    { key: "data-management", title: t("data-pages.data-management"), icon: mdiTableEdit, to: "/group/data", restricted: false, requires: "organizer" },
    { key: "admin-settings", title: t("settings.admin-settings"), icon: mdiWrenchOutline, to: "/admin/site-settings", restricted: false, requires: "admin" },
  ];

  const adminLink = (key: string, title: string, icon: string, to: string): PremiumNavLink =>
    ({ key, title, icon, to, restricted: false, requires: "admin", match: startsWith(to) });
  const admin: PremiumNavLink[] = [
    adminLink("admin-site", t("sidebar.site-settings"), mdiCogOutline, "/admin/site-settings"),
    adminLink("admin-users", t("user.users"), mdiAccountOutline, "/admin/manage/users"),
    adminLink("admin-households", t("household.households"), mdiHomeAccount, "/admin/manage/households"),
    adminLink("admin-groups", t("group.groups"), mdiAccountGroupOutline, "/admin/manage/groups"),
    adminLink("admin-backups", t("sidebar.backups"), mdiDatabaseOutline, "/admin/backups"),
    adminLink("admin-maintenance", t("sidebar.maintenance"), mdiWrenchOutline, "/admin/maintenance"),
    adminLink("admin-ai", t("admin.ai-providers"), mdiAutoFix, "/admin/debug/ai-providers"),
    adminLink("admin-parser", t("sidebar.parser"), mdiTextSearch, "/admin/debug/parser"),
  ];

  return {
    sidebar: [home, recipes, collections, planner, list, importLink],
    tabs: [home, recipes, planner, list, collections],
    more,
    create,
    settings,
    admin,
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
    const allowed = (link: PremiumNavLink) =>
      (!link.restricted || isOwnGroup.value) && hasPermission(link, auth.user.value);
    return {
      sidebar: all.sidebar.filter(allowed),
      tabs: all.tabs.filter(allowed),
      more: all.more.filter(allowed),
      create: all.create.filter(allowed),
      settings: auth.user.value ? all.settings.filter(allowed) : [],
      admin: auth.user.value ? all.admin.filter(allowed) : [],
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

  const inSettings = computed(() => isSettingsPath(route.path));

  return { nav, collections, groupSlug, isActive, inSettings };
}
