// Mealie Premium: kitchen timers for Cook mode.
// - parseDurations(): finds times in free-text steps ("12–15 minutes", "1 hour 30 min", "1½ hours")
// - usePremiumTimers(): a shared set of running timers (kept while you move between steps),
//   based on end timestamps so they stay correct when the phone switches apps.
import { parseQuantity } from "~/composables/use-premium-quantity";

export interface DetectedTime {
  /** The text as written in the step, e.g. "12–15 minutes" */
  text: string;
  /** Shortest time in seconds (equal to maxSeconds when not a range) */
  minSeconds: number;
  maxSeconds: number;
}

const NUM = String.raw`(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?[½⅓⅔¼¾⅛⅜⅝⅞]?|[½⅓⅔¼¾⅛⅜⅝⅞])`;
const UNIT = String.raw`(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b`;
const RANGE_SEP = String.raw`\s*(?:-|–|—|to|or)\s*`;
const PART = new RegExp(String.raw`(${NUM})(?:${RANGE_SEP}(${NUM}))?\s*-?\s*${UNIT}`, "gi");
const JOINER = /^\s*(?:,|and|,\s*and|plus)?\s*$/i;

function unitSeconds(unit: string): number {
  const u = unit.toLowerCase();
  if (u.startsWith("h")) return 3600;
  if (u.startsWith("m")) return 60;
  return 1;
}

function toNumber(raw: string): number | null {
  const value = parseQuantity(raw);
  return typeof value === "number" && value > 0 ? value : null;
}

interface Part { start: number; end: number; min: number; max: number }

/** Find the cooking times mentioned in a step's text. */
export function parseDurations(text: string): DetectedTime[] {
  if (!text) return [];
  // Words people write instead of numbers
  const normalised = text
    .replace(/\bhalf an hour\b|\ba half hour\b/gi, m => " ".repeat(m.length - 6) + "30 min")
    .replace(/\ban hour\b/gi, "1 hour")
    .replace(/\ba minute\b/gi, "1 minute");

  const parts: Part[] = [];
  for (const m of normalised.matchAll(PART)) {
    const [whole, a, b, unit] = m;
    // Single-letter units only directly after a number ("10m", "1h"), never after a space ("5 m")
    if (unit.length === 1 && /\s/.test(whole.slice(-2, -1))) continue;
    const first = toNumber(a);
    if (first === null) continue;
    const second = b ? toNumber(b) : null;
    const factor = unitSeconds(unit);
    const lo = first * factor;
    const hi = (second ?? first) * factor;
    parts.push({ start: m.index!, end: m.index! + whole.length, min: Math.min(lo, hi), max: Math.max(lo, hi) });
  }

  // Join neighbours like "1 hour 30 minutes" or "1 hr and 20 min" into one time
  const merged: Part[] = [];
  for (const p of parts) {
    const prev = merged[merged.length - 1];
    if (prev && prev.min === prev.max && p.min === p.max && JOINER.test(normalised.slice(prev.end, p.start)) && p.max < prev.max) {
      merged[merged.length - 1] = { start: prev.start, end: p.end, min: prev.min + p.min, max: prev.max + p.max };
    }
    else {
      merged.push(p);
    }
  }

  return merged.map(p => ({
    text: text.slice(p.start, p.end).trim(),
    minSeconds: Math.round(p.min),
    maxSeconds: Math.round(p.max),
  }));
}

/** "12 min", "12–15 min", "1 hr 30 min", "45 sec" — short label for a chip */
export function formatDurationLabel(minSeconds: number, maxSeconds = minSeconds): string {
  const one = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h && m) return `${h} hr ${m} min`;
    if (h) return `${h} hr`;
    if (m && sec) return `${m} min ${sec} sec`;
    if (m) return `${m} min`;
    return `${sec} sec`;
  };
  if (minSeconds === maxSeconds) return one(minSeconds);
  if (minSeconds % 60 === 0 && maxSeconds % 60 === 0 && maxSeconds < 3600) {
    return `${minSeconds / 60}–${maxSeconds / 60} min`;
  }
  return `${one(minSeconds)}–${one(maxSeconds)}`;
}

/** Countdown display: "11:42", "1:05:00" */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// ---------------------------------------------------------------- running timers

export interface KitchenTimer {
  id: string;
  label: string;
  /** Step number (1-based) the timer belongs to, for the label */
  step: number | null;
  durationMs: number;
  /** When it ends (epoch ms) while running; null while paused */
  endsAt: number | null;
  /** Time left while paused */
  pausedRemainingMs: number;
  finished: boolean;
}

export function remainingMs(timer: KitchenTimer, now: number): number {
  if (timer.endsAt === null) return timer.pausedRemainingMs;
  return Math.max(0, timer.endsAt - now);
}

const timers = ref<KitchenTimer[]>([]);
const now = ref(Date.now());
let ticker: ReturnType<typeof setInterval> | null = null;
let audio: AudioContext | null = null;

function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audio = audio || new Ctx();
    const t0 = audio.currentTime;
    [0, 0.35, 0.7].forEach((offset) => {
      const osc = audio!.createOscillator();
      const gain = audio!.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, t0 + offset);
      gain.gain.exponentialRampToValueAtTime(0.4, t0 + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + 0.3);
      osc.connect(gain).connect(audio!.destination);
      osc.start(t0 + offset);
      osc.stop(t0 + offset + 0.32);
    });
  }
  catch { /* sound is a bonus */ }
  try { navigator.vibrate?.([300, 150, 300, 150, 300]); }
  catch { /* not supported */ }
}

function tick() {
  now.value = Date.now();
  for (const t of timers.value) {
    if (!t.finished && t.endsAt !== null && t.endsAt <= now.value) {
      t.finished = true;
      chime();
    }
  }
  if (!timers.value.some(t => !t.finished && t.endsAt !== null) && ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

function ensureTicking() {
  if (!ticker) ticker = setInterval(tick, 250);
}

export function usePremiumTimers() {
  function start(label: string, seconds: number, step: number | null = null) {
    // Unlock audio on the user's tap, so the chime can play later
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audio = audio || new Ctx();
      void audio.resume();
    }
    catch { /* ignore */ }
    const durationMs = Math.round(seconds * 1000);
    timers.value.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label,
      step,
      durationMs,
      endsAt: Date.now() + durationMs,
      pausedRemainingMs: durationMs,
      finished: false,
    });
    ensureTicking();
  }

  function find(id: string) {
    return timers.value.find(t => t.id === id);
  }

  function pause(id: string) {
    const t = find(id);
    if (!t || t.endsAt === null || t.finished) return;
    t.pausedRemainingMs = remainingMs(t, Date.now());
    t.endsAt = null;
  }

  function resume(id: string) {
    const t = find(id);
    if (!t || t.endsAt !== null || t.finished) return;
    t.endsAt = Date.now() + t.pausedRemainingMs;
    ensureTicking();
  }

  function addMinute(id: string) {
    const t = find(id);
    if (!t) return;
    if (t.finished) {
      t.finished = false;
      t.endsAt = Date.now() + 60000;
    }
    else if (t.endsAt === null) {
      t.pausedRemainingMs += 60000;
    }
    else {
      t.endsAt += 60000;
    }
    t.durationMs += 60000;
    ensureTicking();
  }

  function remove(id: string) {
    timers.value = timers.value.filter(t => t.id !== id);
    if (!timers.value.some(t => !t.finished && t.endsAt !== null) && ticker) {
      clearInterval(ticker);
      ticker = null;
    }
  }

  return { timers, now, start, pause, resume, addMinute, remove };
}
