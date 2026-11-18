import { describe, expect, test } from "vitest";
import {
  BULK_COLUMNS,
  exportCsv,
  isYes,
  parseBulkInput,
  parseCsv,
  planImport,
  templateCsv,
  toCsv,
} from "./use-premium-bulk-import";

describe("parseCsv", () => {
  test("plain, quoted, escaped quotes, commas and newlines in quotes", () => {
    expect(parseCsv("a,b\r\n\"c, d\",\"say \"\"hi\"\"\"\n\"two\nlines\",x")).toEqual([
      ["a", "b"],
      ["c, d", "say \"hi\""],
      ["two\nlines", "x"],
    ]);
  });

  test("ignores a BOM, blank lines and trailing newline", () => {
    expect(parseCsv("\uFEFFname\n\nolive oil\n")).toEqual([["name"], ["olive oil"]]);
  });

  test("round-trips through toCsv", () => {
    const rows = [["name", "note"], ["a, b", "he said \"x\""], ["plain", ""]];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

describe("parseBulkInput", () => {
  test("a pasted list, one name per line", () => {
    const rows = parseBulkInput("tags", "Weeknight\nMake ahead\n");
    expect(rows.map(r => r.values.name)).toEqual(["Weeknight", "Make ahead"]);
    expect(rows.every(r => r.errors.length === 0)).toBe(true);
  });

  test("header row maps columns in any order", () => {
    const rows = parseBulkInput("foods", "label,name\nProduce,lemon");
    expect(rows[0]!.values).toEqual({ label: "Produce", name: "lemon" });
    expect(rows[0]!.line).toBe(2);
  });

  test("without a header, columns follow the template order", () => {
    const rows = parseBulkInput("units", "cup,cups,c,yes");
    expect(rows[0]!.values).toEqual({ name: "cup", plural_name: "cups", abbreviation: "c", fraction: "yes" });
  });

  test("flags missing names, bad fraction and bad colour", () => {
    expect(parseBulkInput("units", "name,fraction\n,yes")[0]!.errors).toContain("missing-name");
    expect(parseBulkInput("units", "name,fraction\ncup,maybe")[0]!.errors).toContain("bad-fraction");
    expect(parseBulkInput("labels", "name,color\nProduce,green")[0]!.errors).toContain("bad-color");
    expect(parseBulkInput("labels", "name,color\nProduce,#536B32")[0]!.errors).toEqual([]);
  });

  test("yes/no values", () => {
    expect(isYes("Yes")).toBe(true);
    expect(isYes("1")).toBe(true);
    expect(isYes("no")).toBe(false);
    expect(isYes("")).toBe(false);
  });
});

describe("planImport", () => {
  test("new, already exists (any case), repeated in the file, invalid", () => {
    const rows = parseBulkInput("tags", "name\nWeeknight\nweeknight\nDinner Party\n\"\"\nmake AHEAD");
    const plan = planImport(rows, ["Make ahead"]);
    expect(plan.map(r => [r.values.name, r.status])).toEqual([
      ["Weeknight", "new"],
      ["weeknight", "repeat"],
      ["Dinner Party", "new"],
      ["make AHEAD", "exists"],
    ]);
  });

  test("a row with a problem is never imported", () => {
    const plan = planImport(parseBulkInput("labels", "Produce,notacolour"), []);
    expect(plan[0]!.status).toBe("invalid");
  });
});

describe("templates and export", () => {
  test("each template starts with the type's columns and re-imports cleanly", () => {
    for (const type of Object.keys(BULK_COLUMNS) as (keyof typeof BULK_COLUMNS)[]) {
      const csv = templateCsv(type);
      expect(parseCsv(csv)[0]).toEqual(BULK_COLUMNS[type]);
      const rows = parseBulkInput(type, csv);
      expect(rows.length).toBe(2);
      expect(rows.every(r => r.errors.length === 0)).toBe(true);
    }
  });

  test("export is sorted by name and uses the same columns", () => {
    const csv = exportCsv("labels", [{ name: "Produce", color: "#536B32" }, { name: "Dairy", color: "#7FA7B5" }]);
    expect(parseCsv(csv)).toEqual([["name", "color"], ["Dairy", "#7FA7B5"], ["Produce", "#536B32"]]);
  });
});
