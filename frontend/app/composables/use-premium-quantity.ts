// Mealie Premium: read and show kitchen quantities as fractions.
// Mealie stores quantities as plain numbers (3/8 cup is 0.375); these helpers
// only change how they are typed and shown in edit boxes.

const UNICODE_FRACTIONS: Record<string, string> = {
  "½": "1/2",
  "⅓": "1/3",
  "⅔": "2/3",
  "¼": "1/4",
  "¾": "3/4",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

/** Denominators shown back as fractions, coarsest first. */
const DISPLAY_DENOMINATORS = [2, 3, 4, 8, 16];
/** How close a stored number must be to a fraction to be shown as one (0.333 -> 1/3, 0.33 stays). */
const DISPLAY_TOLERANCE = 0.002;

/**
 * Parse what a person types: "3/8", "1 1/2", "1-1/2", "½", "1¼", "0.375", "0,375", "2".
 * Returns null when the text isn't a valid, non-negative quantity; "" returns undefined (empty).
 */
export function parseQuantity(input: string): number | null | undefined {
  let text = input.trim();
  if (text === "") {
    return undefined;
  }

  // Fraction symbols, and the typographic fraction slash, become plain "n/d"
  text = text.replace(/⁄/g, "/");
  text = text.replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, ch => ` ${UNICODE_FRACTIONS[ch]}`).trim();
  text = text.replace(/\s+/g, " ");

  // Decimal comma ("0,375") when there's no decimal point
  if (/^\d*,\d+$/.test(text)) {
    text = text.replace(",", ".");
  }

  if (/^(\d+(\.\d+)?|\.\d+)$/.test(text)) {
    return Number(text);
  }

  const mixed = text.match(/^(\d+)[ -](\d+)\/(\d+)$/);
  if (mixed) {
    const [, whole, num, den] = mixed;
    return Number(den) === 0 ? null : Number(whole) + Number(num) / Number(den);
  }

  const fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    const [, num, den] = fraction;
    return Number(den) === 0 ? null : Number(num) / Number(den);
  }

  return null;
}

/** Show a stored number the way a cook writes it: 0.375 -> "3/8", 1.5 -> "1 1/2", 0.3 -> "0.3". */
export function formatQuantity(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "";
  }

  const whole = Math.floor(value);
  const rest = value - whole;
  if (rest < DISPLAY_TOLERANCE) {
    return String(whole);
  }
  if (1 - rest < DISPLAY_TOLERANCE) {
    return String(whole + 1);
  }

  for (const den of DISPLAY_DENOMINATORS) {
    const num = Math.round(rest * den);
    if (num > 0 && num < den && Math.abs(rest - num / den) < DISPLAY_TOLERANCE) {
      return whole > 0 ? `${whole} ${num}/${den}` : `${num}/${den}`;
    }
  }

  // Not a kitchen fraction: plain decimal, without float noise
  return String(Number(value.toFixed(4)));
}
