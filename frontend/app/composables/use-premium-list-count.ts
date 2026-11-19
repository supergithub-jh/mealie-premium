// Mealie Premium: number of shopping list items still to buy, on all of the household's lists added
// together (owner's choice), for the badge on the List menu item. One request (perPage 1, the API's
// total), refreshed when the page changes, when the app comes back into view, and every 2 minutes.
import { useDocumentVisibility, useIntervalFn } from "@vueuse/core";
import { useUserApi } from "~/composables/api";

const count = ref(0);
let started = false;
let pending: Promise<void> | null = null;

/** Badge text: nothing for 0, "99+" above 99. */
export function listBadgeText(n: number): string {
  if (!n || n < 0) return "";
  return n > 99 ? "99+" : String(n);
}

export function usePremiumListCount() {
  const api = useUserApi();
  const auth = useMealieAuth();
  const route = useRoute();

  async function refresh() {
    if (!auth.loggedIn.value) {
      count.value = 0;
      return;
    }
    if (pending) return pending;
    pending = (async () => {
      try {
        const { data } = await api.shopping.items.getAll(1, 1, { queryFilter: "checked = false" });
        count.value = data?.total ?? 0;
      }
      catch {
        // Keep the last value; the badge is a hint, not critical
      }
      finally {
        pending = null;
      }
    })();
    return pending;
  }

  if (!started && import.meta.client) {
    started = true;
    refresh();
    // Detached scope: keeps working when the sidebar/tab bar that first asked is swapped for the other
    effectScope(true).run(() => {
      watch(() => route.fullPath, () => refresh());
      watch(() => auth.loggedIn.value, () => refresh());
      const visibility = useDocumentVisibility();
      watch(visibility, (v) => {
        if (v === "visible") refresh();
      });
      useIntervalFn(() => {
        if (visibility.value === "visible") refresh();
      }, 120_000);
    });
  }

  const badge = computed(() => listBadgeText(count.value));
  return { count, badge, refresh };
}
