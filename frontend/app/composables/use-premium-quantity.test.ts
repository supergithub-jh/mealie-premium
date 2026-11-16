import { describe, expect, test } from "vitest";
import { formatQuantity, parseQuantity } from "./use-premium-quantity";

describe("parseQuantity", () => {
  test.each([
    ["3/8", 0.375],
    ["1 1/2", 1.5],
    ["1-1/2", 1.5],
    ["  2  1/4 ", 2.25],
    ["½", 0.5],
    ["1½", 1.5],
    ["1 ½", 1.5],
    ["¾", 0.75],
    ["3⁄8", 0.375],
    ["0.375", 0.375],
    ["0,375", 0.375],
    [".5", 0.5],
    ["2", 2],
    ["0", 0],
  ])("%s -> %d", (input, expected) => {
    expect(parseQuantity(input)).toBeCloseTo(expected, 10);
  });

  test("thirds keep full precision", () => {
    expect(parseQuantity("1/3")).toBe(1 / 3);
  });

  test("empty text is 'no value', not an error", () => {
    expect(parseQuantity("")).toBeUndefined();
    expect(parseQuantity("   ")).toBeUndefined();
  });

  test.each(["abc", "3/0", "1/2/3", "-1", "1e3", "3 /8", "1.2.3", "38 cups"])("rejects %s", (input) => {
    expect(parseQuantity(input)).toBeNull();
  });
});

describe("formatQuantity", () => {
  test.each([
    [0.375, "3/8"],
    [0.5, "1/2"],
    [1.5, "1 1/2"],
    [2.25, "2 1/4"],
    [1 / 3, "1/3"],
    [0.333, "1/3"],
    [2 / 3, "2/3"],
    [0.0625, "1/16"],
    [2, "2"],
    [0, "0"],
    [0.3, "0.3"],
    [0.33, "0.33"],
    [1.999999, "2"],
    [0.1 + 0.2, "0.3"],
  ])("%d -> %s", (value, expected) => {
    expect(formatQuantity(value)).toBe(expected);
  });

  test("no value shows an empty box", () => {
    expect(formatQuantity(null)).toBe("");
    expect(formatQuantity(undefined)).toBe("");
  });

  test("what is shown parses back to the same number", () => {
    for (const value of [0.375, 1.5, 1 / 3, 2.75, 0.3, 12]) {
      expect(parseQuantity(formatQuantity(value))).toBeCloseTo(value, 3);
    }
  });
});
