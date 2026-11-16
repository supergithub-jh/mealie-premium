// Guards the Premium menu against upstream Mealie renaming or moving pages:
// every menu link must resolve to a real file under app/pages.
import { existsSync, readdirSync } from "fs";
import path from "path";
import { describe, expect, test } from "vitest";
import { buildPremiumNav } from "./use-premium-nav";

const pagesDir = path.resolve(__dirname, "../pages");

/** Resolve a URL path to a Nuxt page file, following [param] folders/files. */
function resolvePage(urlPath: string): string | null {
  const segments = urlPath.split("/").filter(Boolean);
  let dir = pagesDir;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isLast = i === segments.length - 1;
    const entries = existsSync(dir) ? readdirSync(dir) : [];
    const dynamicDir = entries.find(e => /^\[[^\]]+\]$/.test(e));
    if (isLast) {
      const candidates = [
        path.join(dir, `${seg}.vue`),
        path.join(dir, seg, "index.vue"),
        ...entries.filter(e => /^\[[^\]]+\]\.vue$/.test(e)).map(e => path.join(dir, e)),
        ...(dynamicDir ? [path.join(dir, dynamicDir, "index.vue")] : []),
      ];
      return candidates.find(c => existsSync(c)) ?? null;
    }
    if (entries.includes(seg)) {
      dir = path.join(dir, seg);
    }
    else if (dynamicDir) {
      dir = path.join(dir, dynamicDir);
    }
    else {
      return null;
    }
  }
  return existsSync(path.join(dir, "index.vue")) ? path.join(dir, "index.vue") : null;
}

const nav = buildPremiumNav("demo-group", key => key, { aiImport: true });
const allLinks = [...nav.sidebar, ...nav.tabs, ...nav.more, ...nav.create];

describe("Premium navigation", () => {
  test.each(allLinks.map(l => [l.key, l.to]))("%s link (%s) points to an existing page", (_key, to) => {
    expect(resolvePage(to)).not.toBeNull();
  });

  test("phone tab bar has exactly 5 items, Collections last", () => {
    expect(nav.tabs.map(l => l.key)).toEqual(["home", "recipes", "planner", "list", "collections"]);
  });

  test("Home and Recipes are never active at the same time", () => {
    const home = nav.sidebar.find(l => l.key === "home")!;
    const recipes = nav.sidebar.find(l => l.key === "recipes")!;
    for (const p of ["/g/demo-group", "/g/demo-group/r/lemon-herb-salmon"]) {
      expect(home.match!(p) && recipes.match!(p)).toBe(false);
    }
    expect(home.match!("/g/demo-group")).toBe(true);
    expect(recipes.match!("/g/demo-group/r/lemon-herb-salmon")).toBe(true);
    expect(recipes.match!("/g/demo-group/r/create/url")).toBe(false);
  });

  test("AI import only appears when AI is enabled", () => {
    const withoutAi = buildPremiumNav("demo-group", key => key, { aiImport: false });
    expect(withoutAi.create.map(l => l.key)).not.toContain("create-ai");
    expect(nav.create.map(l => l.key)).toContain("create-ai");
  });
});
