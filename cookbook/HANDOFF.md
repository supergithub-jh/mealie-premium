# Mealie Premium (Digital Cookbook): Project Handoff (v0.2.2)

Handoff for Claude Code working in this fork. Written 2026-11-14, updated 2026-11-16 (changelog at the end).
Loaded automatically: the first line of the root `CLAUDE.md` is `@cookbook/HANDOFF.md`.

## 1. What this project is

A personal fork of [Mealie](https://github.com/mealie-recipes/mealie) that restyles the web app into a warm, editorial, cookbook-like experience. The app is called **Mealie Premium**, tagline **Digital Cookbook**. It is for one household, running on the owner's Unraid server.

- **Base:** Mealie release `v3.31.0` (Nuxt 4 + Vue 3 + Vuetify frontend, FastAPI backend).
- **Repo:** `supergithub-jh/mealie-premium` (GitHub fork).
- **Branch:** `feature/premium-cookbook`, which is also the fork's default branch. Upstream's `mealie-next` stays in the fork untouched; never build on it.
- **Scope:** the frontend only. Mealie's backend, API and database stay exactly as upstream.
- **Names:** the visible app name comes from `BRANDING_NAME` ("Mealie Premium" in production from cutover, "Mealie Dev" on the dev copy); the "Digital Cookbook" subtitle is the i18n string `premium.digital-cookbook`. Technical names stay as they are: image `mealie-cookbook`, tags `cookbook-vX.Y.Z`, branch `feature/premium-cookbook`.

## 2. Working agreement with the owner

1. **Describe before building.** Before creating or changing files, state what you plan to build and wait for the owner's approval.
2. **Versions in names.** Every standalone file handed to the owner (patches, compose files, docs, scripts) carries a version in its name, e.g. `mealie-cookbook-dev-v0.2.0.yml`. Bump the version on every change.
3. **Files inside the repo are not renamed per version.** They are versioned through Git tags and image tags instead (section 6).
4. **Plain language.** The owner is technical (Unraid, Docker, reverse proxies) but not a frontend developer. Explain what changed and why, briefly.

## 3. Hard rules

- **No backend changes.** Do not touch `mealie/` (Python), `mealie/alembic/` (migrations), API routes or schemas. This keeps the fork's database identical to upstream, so the owner can switch back to the official Mealie image at any time.
- **Never edit generated types** in `frontend/app/lib/api/types/`.
- **Keep upstream files untouched where possible.** Put fork work in new files so monthly upstream merges rarely conflict:
  - Styles: `frontend/app/assets/cookbook.scss` (exists from phase 1)
  - Components: `frontend/app/components/Domain/Premium/` with a `Premium` prefix (e.g. `PremiumRecipeHero.vue`)
  - When an upstream file must change, keep the edit small and mention it in the commit message.
- **Fork layout (phase 2):** `frontend/app/layouts/default.vue` renders `PremiumLayout` instead of upstream's `DefaultLayout` (one-line upstream edit; upstream's layout files stay untouched). The menu is defined once in `composables/use-premium-nav.ts`, independent of upstream's layout logic. Its test (`use-premium-nav.test.ts`) fails if an upstream merge renames or moves a page a menu item links to.
- **Wording "Collection" (v0.2.1):** the fork calls Mealie's "Cookbooks" **Collections** in all English texts. Done at load time by `lang/premium-terms.ts` (hooked into `lang/locales/en-US.ts` with a two-line upstream edit), not by editing `en-US.json`; it skips the `migration` texts (other apps' names, e.g. "Nextcloud Cookbook") and the fork's `premium` texts. `premium-terms.test.ts` fails if any English text still says "cookbook". Page addresses stay `/cookbooks`.
- **Import page (v0.2.1):** `pages/g/[groupSlug]/r/create.vue` uses `PremiumImportToolsMenu` (always labelled "Import Tools", current tool ticked) instead of `BaseOverflowButton` (small upstream edit).
- **Fraction quantities (v0.2.2):** `PremiumQuantityInput` (logic in `composables/use-premium-quantity.ts`, tested) replaces Mealie's number boxes for ingredient quantity (`RecipeIngredientEditor.vue`), shopping list quantity (`ShoppingListItemDetails.vue`), servings and yield (`RecipePageInfoEditor.vue`) and the servings box of the scale popup (`RecipeScaleEditButton.vue`). It accepts "3/8", "1 1/2", "1-1/2", "½", "0.375", "0,375"; stores a plain number as Mealie expects; shows common fractions back (halves to sixteenths). Small upstream edits in those four files.
- **Naming collision:** Mealie already has a "Cookbook" feature (its name for recipe collections) under `components/Domain/Cookbook/`. Don't use `Cookbook` as a component prefix; use `Premium`.
- **Follow upstream conventions** in the root `CLAUDE.md` (component naming, composables, i18n). New user-facing strings go through i18n with English text.
- **The repo is public** (AGPL). Never commit secrets, API keys, IPs, domains, backups or personal recipe data.

## 4. Design system

Source of truth: the owner's deck `Mealie_Premium_Cookbook_Project_Handoff.pptx` (ask for screenshots when you need a visual reference).

**Palette** (all text pairings pass WCAG AA):

| Token | Hex | Use |
| --- | --- | --- |
| Ivory | `#FAF7F2` | Page background |
| Sage | `#E5EAD5` | Soft panels, chips, selected states |
| Olive | `#536B32` | Primary: buttons, links, active nav (white text 6.0:1) |
| Espresso | `#322C25` | Body text and headings (12.9:1 on Ivory) |
| White | `#FFFFFF` | Cards |

Dark mode: primary `#A3B86C`, secondary `#E5EAD5`, on Mealie's dark background.

- **Type:** Playfair Display for headings and recipe titles; Inter for body text and UI. The font files (variable woff2, latin + latin-ext, SIL OFL with licences) are committed in `frontend/public/fonts/premium/` and declared with `@font-face` in `cookbook.scss`. Not via `@nuxt/fonts` providers: those download at build time, which makes the build depend on font services; committed files always work offline and in any build.
- **Shape:** 16–20px card radius, soft shadow `0 4px 16px rgba(50,44,37,0.06)`, generous whitespace, photo-first cards.
- **Brand colors** are set with Mealie's `THEME_LIGHT_*` / `THEME_DARK_*` environment variables (see the compose file). The Ivory background, fonts and shapes are in `cookbook.scss`.

**Layout:**
- Desktop/tablet: a light left sidebar (Home, Recipes, Planner, Shopping List, Collections, Settings), with a search bar on top.
- Phone **and portrait tablet** (< 960px, Vuetify `mdAndUp` false): a bottom tab bar with 5 items (Home, Recipes, Planner, List, Collections) and a compact top bar. Import, Recipe Finder, Timeline, organizers and the individual collections are in the profile menu.
- Desktop sidebar: Home, Recipes, Collections, Meal Planner, Shopping List, Import, a collapsed "More" group, Settings at the bottom. Top bar: search (opens Mealie's search dialog, `/` shortcut), "+ Add Recipe" menu, profile menu.
- Until phase 4, **Home opens the recipe list** (same page as Recipes); only Home is highlighted there.
- Same look on both, different layout. Use Vuetify's display breakpoints (`useDisplay`).

## 5. What Mealie can and can't supply

Design around the real data:

| Mockup feature | Reality | Approach |
| --- | --- | --- |
| Pantry | Doesn't exist in Mealie | Out of scope; a possible later separate project |
| Review counts ("4.8 (312)") | Ratings are per user, no counts | Show the household's own stars only |
| Notification bell | No notification feed | Leave it out |
| Recipe of the Day | No such endpoint | **Recipe of the Week** instead: newest recipe tagged "Recipe of the Week" (imported weekly by the helper, phase 5); until then a pick from the household's own recipes that stays the same all week (client-side) |
| Cook-mode timers | Steps are free text | Parse durations ("12–15 minutes") from step text |
| Ingredients | Structured (quantity, unit, food, note, display, sections, links to steps) | Use the real types and existing composables; never flatten to strings |
| Photos | Often missing or inconsistent | Every image slot needs a designed fallback |
| Shopping list categories | Food labels | Group by label |
| Collections | Mealie "Cookbooks" | Restyle the existing feature |

## 6. Versioning and releases

| Thing | Format | Example |
| --- | --- | --- |
| Git tag (triggers build) | `cookbook-vX.Y.Z` | `cookbook-v0.2.0` |
| Docker image | `ghcr.io/<owner>/mealie-cookbook:vX.Y.Z` | `...:v0.2.0` |
| Handed-over files | name + `-vX.Y.Z` | `mealie-cookbook-dev-v0.2.0.yml` |
| Phases | minor version | phase 2 = `v0.2.x` |

`.github/workflows/cookbook-image.yml` builds on `cookbook-v*` tags (amd64 only) and can also be run by hand, which produces a `dev-<sha>` tag. The image package on ghcr.io is **public**, so Unraid pulls it without logging in.

**GitHub Actions setup (done in the GitHub web UI, not in files):**
- Actions are enabled. These 12 upstream workflows are **disabled** (Actions tab → workflow → ⋯ → Disable): Auto-merge dependency PRs, Auto-merge l10n PRs, CodeQL, Deploy Documentation, Automatic Locale Sync, Docker Nightly Production, Pull Request Linter, PR CI, Release Drafter, Docker Build Production, Scheduled Checks, Stale.
- The remaining upstream workflows (Backend/Frontend Lint and Test, Build Containers, Build Package, E2E Tests, Trivy Container Scanning) are `workflow_call` only; they can't start on their own, so they stay enabled.
- Don't delete or edit upstream workflow files; disabling them in the UI avoids merge conflicts.

**Making a release:** Claude Code cloud sessions can push branches but **not tags**. So the owner creates each release in the GitHub web UI: Releases → Draft a new release → tag `cookbook-vX.Y.Z` (create on publish) → target `feature/premium-cookbook` → Publish. That starts the image build. Claude prepares the commit, checks and release notes beforehand.

**Upstream updates:** about once a month, add upstream if missing (`git remote add upstream https://github.com/mealie-recipes/mealie`), `git fetch upstream --tags`, then merge the newest **release tag** (never `mealie-next`), test, and release a patch version. Production is moved to the same Mealie release at the same time (section 7). After each merge: run `pnpm test:ci` (the menu test catches moved pages), and skim upstream changes to `components/Layout/` (header, sidebar, default layout) for new menu items or behaviour worth mirroring in the Premium layout. Before restoring a production backup into a fork build, confirm production's Mealie version is not ahead of the fork's base in database migrations (`mealie/alembic/versions`).

## 7. Environments

| Environment | Where | Notes |
| --- | --- | --- |
| Production | Official Mealie image `v3.31.0` (pinned release, matches the fork's base) on Unraid, behind the owner's Pangolin reverse proxy (HTTPS) | Never touched by this project until cutover; at cutover only the image changes, Pangolin setup stays |
| Dev copy | `mealie-cookbook-dev` compose stack on Unraid (Compose Manager plugin), image `mealie-cookbook:vX.Y.Z`, SQLite. LAN: `http://<unraid-ip>:9926`. HTTPS: `https://<unraid-tailscale-name>:8443` via `tailscale serve` | Shown as "Mealie Dev" (`BRANDING_NAME`). Not on Pangolin. `BASE_URL` is the Tailscale address. Seeded from a production backup; disable all webhooks and notifiers after **every** restore |
| Local frontend dev | `cd frontend && API_URL=http://<unraid-ip>:9926 pnpm dev` | Live reload against the dev copy's API |

The dev compose file is a handed-over file (`mealie-cookbook-dev-vX.Y.Z.yml`, latest v0.1.1), not committed to the repo.

**HTTPS matters for testing:** Mealie's "Secure Site" check, clipboard (copy buttons) and installing as a phone app (PWA) only work over HTTPS. Test those on the Tailscale address, not the LAN one.

**PWA:** Mealie already ships a PWA manifest (served by the backend). Its app colour follows `THEME_LIGHT_PRIMARY` and its name follows `BRANDING_NAME`. The splash background colour is hard-coded in the backend, so it stays as upstream. Custom icons are possible later as a frontend change.

Checks before every tag: `pnpm lint` and `pnpm test:ci` in `frontend/`, plus a visual check at phone (390px), tablet and desktop widths, in light and dark mode.

## 8. Phase plan

| Phase | Version | Scope | Status |
| --- | --- | --- | --- |
| 1. Setup | v0.1.x | Fork, branch, image workflow, `cookbook.scss`, palette via env, dev copy on Unraid | Done: `cookbook-v0.1.0` released and built; dev copy running with Tailscale HTTPS |
| 2. Theme and navigation shell | v0.2.x | Sidebar (desktop), bottom tab bar (phone), top/search bar, global Vuetify theming, fonts; v0.2.1: "Collection" wording, sidebar descender fix, "Import Tools" menu; v0.2.2: fraction quantities | `cookbook-v0.2.0` released; v0.2.1 and v0.2.2 built, awaiting release |
| 3. Recipe detail and Cook mode | v0.3.x | Editorial recipe page, servings scaling, ingredient checklist, step view, cook mode with parsed timers and screen wake lock; "Generate image with AI" button (hidden until the helper exists) | Planned |
| 4. Main screens | v0.4.x | Home page of its own (**Recipe of the Week**, Tonight, recent, quick filters), Recipes grid, Meal planner, Shopping list (incl. item-count badge on the menu) | Planned |
| 5. AI helper | v0.5.x | Separate `mealie-ai-helper` container (section 9): video importer, AI recipe images, weekly Recipe of the Week import, AI Recipe Finder (from the web); plus an iOS Shortcut for the Share menu | Planned |
| 6. Test and cutover | v1.0.0 | Full checks, production backup, switch production to the fork image, keep the official image for rollback | Planned |

## 9. Phase 5 preview: AI helper (video importer + AI images)

One small separate service (`mealie-ai-helper`), not a change to Mealie's backend. Mealie's own AI integration only does text and transcription (no image generation), and never returns its saved API key to the browser, so the helper holds its own OpenAI key.

**Video importer:**

1. Receives a Reel, TikTok or YouTube Shorts link.
2. Reads the caption and description first; many already contain the recipe.
3. If needed, downloads the clip with `yt-dlp`, extracts the audio and transcribes it (OpenAI, which the owner already uses).
4. Has the AI model produce a schema.org Recipe and creates it through Mealie's API with a Mealie API token.
5. Auto-updates `yt-dlp`; supports an optional Instagram cookies file.

The Import screen gets Link / Photo / Video options. iOS can't share into a web app, so an iOS Shortcut sends shared links to the importer.

**AI recipe images:**
1. Recipes without a photo show the designed placeholder with "Generate image with AI"; also offered after import and in the recipe's image menu (replace, regenerate, revert).
2. The helper builds a prompt from the recipe name and main ingredients, asks OpenAI's image model, and uploads the result with Mealie's normal recipe image endpoint (`PUT /api/recipes/{slug}/image`).
3. Optional auto-generate for new recipes without a photo (via Mealie's "recipe created" notifier), **off by default** (costs a few cents per image).
4. Tag such recipes "AI image" so generated photos stay recognisable.

**Recipe of the Week (weekly import):**
1. A weekly timer in the helper reads open RSS feeds of recipe sites that publish standard recipe markup (sources chosen at build time; owner has no preference), picks one recipe not already in Mealie, and imports it with Mealie's `POST /api/recipes/create/url`.
2. Tags it "Recipe of the Week"; Home shows the newest such recipe.
3. **Not NYT Cooking:** subscription-only, and its terms forbid automated scraping/copying. Same for other paywalled sites.

**AI Recipe Finder (from the web):**
1. New section on the Recipe Finder page: the user types what they want ("quick salmon dinner").
2. The helper runs a web search for real recipe pages (needs a web search API key; choose a provider and check current pricing at build time), and the AI picks and summarises the top 10, with the source shown.
3. "Import" uses Mealie's normal URL import. Not AI-invented recipes: an AI asked for links tends to make up addresses.

**Security:** the helper only accepts requests from logged-in Mealie users (it checks the user's Mealie session) and is reached through the same address as Mealie (Tailscale / Pangolin path), not exposed on its own.

## 10. Open decisions

- Pantry: deferred to a separate future project; it would need backend work.

**Decided:**
- Production moves from `nightly` to pinned release tags, starting with `v3.31.0`, and follows the fork's base release from then on. Reason: `nightly` can add database migrations the fork doesn't have yet, after which production backups no longer restore into the dev copy. (On 2026-11-15 `nightly` had no migrations beyond `v3.31.0`, so the switch is safe.) Status: done 2026-11-16, production runs `v3.31.0`.
- The dev copy stays off Pangolin; remote access is through Tailscale.
- 5th phone tab: Collections (Import via the profile menu and "+ Add Recipe"). Revisit when the helper exists (phase 5).
- Tab bar below 960px (phones and portrait tablets); sidebar from 960px.
- Branding: app name "Mealie Premium" (via `BRANDING_NAME`), subtitle "Digital Cookbook".
- Menu logic is the fork's own (`use-premium-nav.ts`), not a copy of upstream's layout code.
- "Cookbook(s)" is shown as "Collection(s)" in English (v0.2.1).
- Recipe of the Week (not of the Day), from open recipe feeds, not NYT Cooking. AI Recipe Finder searches the web (option A), not AI-invented recipes.
- Order: phase 3 (recipe page, Cook mode) next, then phase 4, then the helper (phase 5).

## 11. Changelog

- **v0.2.2** (2026-11-16): quantities, servings and yield accept fractions ("3/8 cup").
- **v0.2.1** (2026-11-16): "Collection" wording via `premium-terms.ts`; "Import Tools" menu; sidebar descender fix; Recipe of the Week and AI Recipe Finder added to the plan.
- **v0.2.0** (2026-11-16): phase 2 built (Premium layout, menu, fonts committed); branding "Mealie Premium" / "Digital Cookbook"; phase 2 decisions; phase 5 becomes `mealie-ai-helper` with AI recipe images.
- **v0.1.2** (2026-11-16): production switched from `nightly` to `v3.31.0`.
- **v0.1.1** (2026-11-16): phase 1 done; repo name; GitHub Actions setup and release process (owner creates tags in the web UI); dev copy details (compose stack, Tailscale HTTPS, "Mealie Dev", webhook rule); PWA notes; production pinned to release tags.
- **v0.1.0** (2026-11-14): first handoff.
