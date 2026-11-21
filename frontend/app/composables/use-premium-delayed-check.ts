// Mealie Premium: ticking a shopping list item keeps it in place, crossed out, for a few seconds before it
// is saved as checked and moves to "Done" (owner's choice, v0.4.1), so a mis-tap can be undone by tapping
// again. Leaving the page saves anything still waiting.

export interface DelayedCheckItem {
  id: string;
  checked?: boolean | null;
}

export function createDelayedCheck<T extends DelayedCheckItem>(
  commit: (item: T) => void,
  delayMs = 4000,
  // Wrapped: calling the browser's setTimeout as a method of another object throws "Illegal invocation"
  timers: { set: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>; clear: (t: ReturnType<typeof setTimeout>) => void } = {
    set: (fn, ms) => setTimeout(fn, ms),
    clear: t => clearTimeout(t),
  },
) {
  const pending = new Map<string, { item: T; timer: ReturnType<typeof setTimeout> }>();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(fn => fn());

  function finish(id: string) {
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    commit({ ...entry.item, checked: true });
    notify();
  }

  /** Tap on an unchecked item: start the countdown, or cancel it if it's already counting down. */
  function toggle(item: T) {
    const entry = pending.get(item.id);
    if (entry) {
      timers.clear(entry.timer);
      pending.delete(item.id);
    }
    else {
      pending.set(item.id, { item, timer: timers.set(() => finish(item.id), delayMs) });
    }
    notify();
  }

  function isPending(id: string) {
    return pending.has(id);
  }

  /** Save everything still waiting now (leaving the page, or before a bulk action). */
  function flush() {
    for (const [id, entry] of [...pending]) {
      timers.clear(entry.timer);
      finish(id);
    }
  }

  function onChange(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return { toggle, isPending, flush, onChange, size: () => pending.size };
}

/** Vue wrapper: reactive "pending" set, flushed when the component unmounts. */
export function useDelayedCheck<T extends DelayedCheckItem>(commit: (item: T) => void, delayMs = 4000) {
  const core = createDelayedCheck(commit, delayMs);
  const version = ref(0);
  core.onChange(() => version.value++);
  const isPending = (id: string) => {
    void version.value; // track changes
    return core.isPending(id);
  };
  onBeforeUnmount(() => core.flush());
  return { toggle: core.toggle, isPending, flush: core.flush };
}
