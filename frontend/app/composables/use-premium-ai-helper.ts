// Mealie Premium: talks to the AI helper (the separate mealie-ai-helper container, phase 5), reached at
// the same address as Mealie under /ai-helper. If the helper isn't installed or can't be reached, every
// AI feature simply stays hidden. The user's Mealie login goes along (the app's usual Authorization
// header); the helper confirms it with Mealie.
import type { AxiosError } from "axios";

export const AI_HELPER_BASE = "/ai-helper/api";

export interface AiHelperStatus {
  version: string;
  images: { enabled: boolean; limit: number; usedToday: number; model: string; tag: string };
}

export interface AiImageState {
  aiImage: boolean;
  canRevert: boolean;
}

// One shared status for the whole app: checked once, again after 5 minutes if it failed
const status = ref<AiHelperStatus | null>(null);
let checkedAt = 0;
let pending: Promise<void> | null = null;

/** The helper's message for a failed request (it explains limits and OpenAI errors in plain words). */
export function aiHelperError(err: unknown, fallback: string): string {
  const e = err as AxiosError<{ detail?: string }>;
  const detail = e?.response?.data?.detail;
  return typeof detail === "string" && detail ? detail : fallback;
}

export function useAiHelper() {
  const { $axios } = useNuxtApp();

  async function refreshStatus(force = false) {
    const stale = Date.now() - checkedAt > (status.value ? 30 * 60_000 : 5 * 60_000);
    if (!force && !stale) return;
    if (pending) return pending;
    pending = (async () => {
      try {
        const { data } = await $axios.get<AiHelperStatus>(`${AI_HELPER_BASE}/status`, { timeout: 8000 });
        status.value = data && typeof data === "object" && "images" in data ? data : null;
      }
      catch {
        status.value = null; // no helper: AI features stay hidden
      }
      finally {
        checkedAt = Date.now();
        pending = null;
      }
    })();
    return pending;
  }

  const imagesReady = computed(() => !!status.value?.images.enabled);

  async function imageState(slug: string): Promise<AiImageState | null> {
    try {
      const { data } = await $axios.get<AiImageState>(`${AI_HELPER_BASE}/images/${encodeURIComponent(slug)}`);
      return data;
    }
    catch {
      return null;
    }
  }

  /** Makes (or remakes) the recipe's AI photo. Can take up to a minute. */
  async function generateImage(slug: string) {
    const { data } = await $axios.post<{ usedToday: number; limit: number }>(
      `${AI_HELPER_BASE}/images/${encodeURIComponent(slug)}`,
      {},
      { timeout: 200_000 },
    );
    if (status.value) status.value.images.usedToday = data.usedToday;
    return data;
  }

  async function revertImage(slug: string) {
    await $axios.post(`${AI_HELPER_BASE}/images/${encodeURIComponent(slug)}/revert`, {});
  }

  refreshStatus();

  return { status, imagesReady, refreshStatus, imageState, generateImage, revertImage };
}
