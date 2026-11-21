import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createDelayedCheck } from "./use-premium-delayed-check";

describe("delayed check", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("saves as checked after the delay", () => {
    const commit = vi.fn();
    const dc = createDelayedCheck(commit, 4000);
    dc.toggle({ id: "a", checked: false });
    expect(dc.isPending("a")).toBe(true);
    vi.advanceTimersByTime(3999);
    expect(commit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(commit).toHaveBeenCalledWith({ id: "a", checked: true });
    expect(dc.isPending("a")).toBe(false);
  });

  test("a second tap undoes it", () => {
    const commit = vi.fn();
    const dc = createDelayedCheck(commit, 4000);
    dc.toggle({ id: "a" });
    dc.toggle({ id: "a" });
    vi.advanceTimersByTime(10_000);
    expect(commit).not.toHaveBeenCalled();
    expect(dc.isPending("a")).toBe(false);
  });

  test("flush saves everything waiting, once", () => {
    const commit = vi.fn();
    const dc = createDelayedCheck(commit, 4000);
    dc.toggle({ id: "a" });
    dc.toggle({ id: "b" });
    dc.flush();
    expect(commit).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(10_000);
    expect(commit).toHaveBeenCalledTimes(2);
  });

  test("default timers work when called through the options object (no Illegal invocation)", () => {
    vi.useRealTimers();
    const realSet = globalThis.setTimeout;
    const strict = function (this: unknown, fn: () => void, ms?: number) {
      if (this !== undefined && this !== globalThis) throw new TypeError("Illegal invocation");
      return realSet(fn, ms);
    } as unknown as typeof setTimeout;
    globalThis.setTimeout = strict;
    try {
      const dc = createDelayedCheck(vi.fn(), 4000);
      expect(() => dc.toggle({ id: "a" })).not.toThrow();
      dc.flush();
    }
    finally {
      globalThis.setTimeout = realSet;
    }
  });

  test("listeners hear changes", () => {
    const dc = createDelayedCheck(vi.fn(), 4000);
    const fn = vi.fn();
    dc.onChange(fn);
    dc.toggle({ id: "a" });
    vi.advanceTimersByTime(4000);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
