import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { formatCountdown, formatDurationLabel, parseDurations, remainingMs, usePremiumTimers } from "./use-premium-timers";

const seconds = (text: string) => parseDurations(text).map(d => [d.minSeconds, d.maxSeconds]);

describe("parseDurations", () => {
  test.each([
    ["Bake for 12–15 minutes, until flaky.", [[720, 900]]],
    ["Simmer 12-15 min", [[720, 900]]],
    ["Cook for 10 to 12 minutes", [[600, 720]]],
    ["Rest 5 minutes.", [[300, 300]]],
    ["Roast 1 hour 30 minutes", [[5400, 5400]]],
    ["Bake 1 hr and 20 min", [[4800, 4800]]],
    ["Braise for 1½ hours", [[5400, 5400]]],
    ["Braise for 1 1/2 hours", [[5400, 5400]]],
    ["Boil 30 seconds", [[30, 30]]],
    ["Microwave 45 sec", [[45, 45]]],
    ["Rest for half an hour", [[1800, 1800]]],
    ["Chill for an hour", [[3600, 3600]]],
    ["Proof 2-3 hours", [[7200, 10800]]],
    ["Bake 10m then broil 2m", [[600, 600], [120, 120]]],
    ["Sear 2 minutes per side, then rest 5 minutes", [[120, 120], [300, 300]]],
  ])("%s", (text, expected) => {
    expect(seconds(text)).toEqual(expected);
  });

  test.each([
    "Preheat the oven to 400°F.",
    "Use an 8-inch pan.",
    "Chill overnight.",
    "Add 2 cups flour and 3 eggs.",
    "Season with salt, pepper and 1 tsp paprika.",
    "Cut into 5 m strips",
  ])("finds no time in: %s", (text) => {
    expect(parseDurations(text)).toEqual([]);
  });

  test("keeps the original wording for the chip", () => {
    expect(parseDurations("Bake for 12–15 minutes, until flaky.")[0]!.text).toBe("12–15 minutes");
  });
});

describe("labels", () => {
  test.each([
    [720, 900, "12–15 min"],
    [300, 300, "5 min"],
    [5400, 5400, "1 hr 30 min"],
    [3600, 3600, "1 hr"],
    [45, 45, "45 sec"],
    [90, 90, "1 min 30 sec"],
    [7200, 10800, "2 hr–3 hr"],
  ])("formatDurationLabel(%d, %d) = %s", (lo, hi, label) => {
    expect(formatDurationLabel(lo, hi)).toBe(label);
  });

  test.each([
    [702000, "11:42"],
    [0, "00:00"],
    [3900000, "1:05:00"],
    [500, "00:01"],
  ])("formatCountdown(%d) = %s", (ms, text) => {
    expect(formatCountdown(ms)).toBe(text);
  });
});

describe("running timers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T12:00:00Z"));
  });
  afterEach(() => {
    const { timers, remove } = usePremiumTimers();
    [...timers.value].forEach(t => remove(t.id));
    vi.useRealTimers();
  });

  test("counts down from end time, pauses and resumes", () => {
    const { timers, start, pause, resume } = usePremiumTimers();
    start("Bake salmon", 720, 3);
    const t = timers.value[0]!;
    vi.advanceTimersByTime(18000);
    expect(remainingMs(t, Date.now())).toBe(702000);
    pause(t.id);
    vi.advanceTimersByTime(60000);
    expect(remainingMs(timers.value[0]!, Date.now())).toBe(702000);
    resume(t.id);
    vi.advanceTimersByTime(2000);
    expect(remainingMs(timers.value[0]!, Date.now())).toBe(700000);
  });

  test("finishes, and +1 min restarts a finished timer", () => {
    const { timers, start, addMinute } = usePremiumTimers();
    start("Rest", 5);
    vi.advanceTimersByTime(6000);
    expect(timers.value[0]!.finished).toBe(true);
    addMinute(timers.value[0]!.id);
    expect(timers.value[0]!.finished).toBe(false);
    expect(remainingMs(timers.value[0]!, Date.now())).toBe(60000);
  });
});
