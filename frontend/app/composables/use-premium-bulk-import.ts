// Mealie Premium: Bulk Import for Data Management (foods, units, labels, tags, categories, tools).
// Pure helpers: CSV reading/writing, templates, and the import plan (what's new, what's skipped).
// Importing only ADDS items; anything that already exists (same name, any letter case) is skipped.

export type BulkType = "foods" | "units" | "labels" | "tags" | "categories" | "tools";
export const BULK_TYPES: BulkType[] = ["foods", "units", "labels", "tags", "categories", "tools"];

/** CSV columns per type; the first is always `name` (required). */
export const BULK_COLUMNS: Record<BulkType, string[]> = {
  foods: ["name", "plural_name", "description", "label"],
  units: ["name", "plural_name", "abbreviation", "fraction"],
  labels: ["name", "color"],
  tags: ["name"],
  categories: ["name"],
  tools: ["name"],
};

/** Two example rows for each template (removed or unticked before importing). */
const TEMPLATE_EXAMPLES: Record<BulkType, string[][]> = {
  foods: [["olive oil", "", "extra virgin", "Pantry"], ["lemon", "lemons", "", "Produce"]],
  units: [["cup", "cups", "c", "yes"], ["gram", "grams", "g", "no"]],
  labels: [["Produce", "#536B32"], ["Dairy", "#7FA7B5"]],
  tags: [["Weeknight"], ["Make ahead"]],
  categories: [["Dinner"], ["Dessert"]],
  tools: [["Dutch oven"], ["Stand mixer"]],
};

// ---------------------------------------------------------------- CSV

/** Read CSV text into rows of cells. Handles quotes, "" escapes, commas/newlines in quotes, CRLF and a BOM. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === "\"") {
        if (src[i + 1] === "\"") {
          cell += "\"";
          i++;
        }
        else {
          quoted = false;
        }
      }
      else {
        cell += ch;
      }
    }
    else if (ch === "\"") {
      quoted = true;
    }
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    }
    else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map(r => r.map(c => c.trim())).filter(r => r.some(c => c !== ""));
}

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) || /^\s|\s$/.test(value) ? `"${value.replace(/"/g, "\"\"")}"` : value;
}

/** Write rows as CSV (CRLF line endings, as spreadsheet apps expect). */
export function toCsv(rows: string[][]): string {
  return rows.map(r => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function templateCsv(type: BulkType): string {
  return toCsv([BULK_COLUMNS[type], ...TEMPLATE_EXAMPLES[type]]);
}

/** One existing item, flattened to the type's columns, for "Export current list". */
export type ExportRow = Record<string, string>;

export function exportCsv(type: BulkType, items: ExportRow[]): string {
  const cols = BULK_COLUMNS[type];
  const sorted = [...items].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return toCsv([cols, ...sorted.map(item => cols.map(c => item[c] ?? ""))]);
}

// ---------------------------------------------------------------- rows

export interface BulkRow {
  /** Line number in the input, for messages */
  line: number;
  values: Record<string, string>;
  /** Problems that stop this row being imported */
  errors: string[];
}

const YES = ["yes", "y", "true", "1", "x"];
const NO = ["no", "n", "false", "0", ""];

/** Turn pasted text or CSV into rows. A first row of known column names (including "name") is the header. */
export function parseBulkInput(type: BulkType, text: string): BulkRow[] {
  const table = parseCsv(text);
  if (!table.length) return [];

  let cols = BULK_COLUMNS[type];
  let start = 0;
  const first = table[0]!.map(c => c.toLowerCase().replace(/\s+/g, "_"));
  if (first.includes("name") && first.every(c => BULK_COLUMNS[type].includes(c) || c === "")) {
    // Header row: map columns by name, so they can be in any order
    cols = first;
    start = 1;
  }

  return table.slice(start).map((cells, i) => {
    const values: Record<string, string> = {};
    cols.forEach((col, ci) => {
      if (BULK_COLUMNS[type].includes(col)) values[col] = cells[ci] ?? "";
    });
    const errors: string[] = [];
    if (!values.name) errors.push("missing-name");
    if (type === "units" && values.fraction !== undefined) {
      const f = values.fraction.toLowerCase();
      if (!YES.includes(f) && !NO.includes(f)) errors.push("bad-fraction");
    }
    if (type === "labels" && values.color && !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(values.color)) {
      errors.push("bad-color");
    }
    return { line: start + i + 1, values, errors };
  });
}

export function isYes(value?: string): boolean {
  return YES.includes((value || "").trim().toLowerCase());
}

const key = (name: string) => name.trim().toLowerCase();

export type PlanStatus = "new" | "exists" | "repeat" | "invalid";

export interface PlannedRow extends BulkRow {
  status: PlanStatus;
}

/** Decide what each row does: new, already exists, repeated in the file, or has a problem. */
export function planImport(rows: BulkRow[], existingNames: string[]): PlannedRow[] {
  const existing = new Set(existingNames.map(key));
  const seen = new Set<string>();
  return rows.map((row) => {
    if (row.errors.length) return { ...row, status: "invalid" as const };
    const k = key(row.values.name!);
    if (existing.has(k)) return { ...row, status: "exists" as const };
    if (seen.has(k)) return { ...row, status: "repeat" as const };
    seen.add(k);
    return { ...row, status: "new" as const };
  });
}
