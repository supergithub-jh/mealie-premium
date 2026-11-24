# Mealie Premium (Digital Cookbook): Project Handoff (v0.5.0)

Handoff for Claude Code working in this fork. Written 2026-11-14, updated 2026-11-24 (changelog at the end).
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
4. **QA list.** The owner notes issues while testing in a private claude.ai page titled **"Mealie Premium QA"** (find it with the Artifact tool's `list`; the link is not kept in this public repo). Items live in its database collection `items` (`text`, `area`, `device`, `priority`, `status` new/planned/done/wontfix, `screenshots` asset ids, `version`, `claudeNote`). When the owner asks for the next batch: read open items, propose the batch, set them to `planned` with a note; after the build, set `done` with the `version`. Screenshots stay private there; never copy them into the repo.
5. **Plain language.** The owner is technical (Unraid, Docker, reverse proxies) but not a frontend developer. Explain what changed and why, briefly.

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
- **Recipe page and Cook mode (v0.3.0):** `components/Domain/Recipe/RecipePage/RecipePage.vue` (small upstream edit) renders `PremiumRecipeView` in view mode and `PremiumCookMode` in cook mode; Mealie's own container now renders only in edit mode, and its Cook mode blocks are switched off by `const useUpstreamCookMode = false`. Editing is still Mealie's editor. The Premium views reuse Mealie's `RecipeIngredients` (checklist, ticks in session storage shared with Cook mode), `RecipePageScale` (servings and unit system), `RecipeContextMenu`, `RecipeFavoriteBadge`, `RecipeRating`, `RecipeLastMade`, `RecipeNotes`, `RecipeNutrition`, `RecipeAssets`, `RecipePageOrganizers`, `RecipePageComments` and `RecipePrintContainer`. Timer logic: `composables/use-premium-timers.ts` (parses "12–15 minutes", "1 hr 30 min", "1½ hours", "half an hour"; tested). AI photo buttons appear only when the AI helper answers (section 3, "AI helper"). Cook mode keeps its step per recipe and its own light/dark choice in local storage (`composables/use-premium-cook.ts`).
- **Version line (v0.3.1, v0.3.2):** `frontend/app/premium-version.ts` holds `PREMIUM_VERSION`; the sidebar (under "Digital Cookbook") and the bottom of the profile menu show the fork's version only, e.g. "v0.3.2" (owner's choice; Mealie's version is in Admin › Site Settings). **Bump `PREMIUM_VERSION` in every release commit** together with a new top entry in the changelog (section 11); `premium-version.test.ts` fails if they differ.
- **Profile pictures (v0.3.1):** 12 illustrated avatars drawn for this project in `frontend/public/avatars/premium/` (list in `composables/use-premium-avatars.ts`). `PremiumAvatarPicker` ("Choose a picture", next to Mealie's upload button in `pages/user/profile/edit.vue`, small upstream edit) renders the SVG to PNG and uploads it through Mealie's normal `POST /api/users/{id}/image`, so it is an ordinary profile picture.
- **Bulk Import (v0.3.1):** `pages/group/data/import.vue` (new page; one menu entry added in upstream `pages/group/data.vue`). Types: foods, units, labels, tags, categories, tools; paste or CSV, preview (new / already exists / repeated / problem), adds new items one by one through the normal API, never changes existing ones. "Download CSV template" and "Export current list" per type. Logic and CSV handling in `composables/use-premium-bulk-import.ts` (tested). Recipes are not imported here; the page links to Import Tools.
- **Admin pages (v0.3.2):** upstream `layouts/admin.vue` is replaced by a two-line file rendering `PremiumLayout` (like `default.vue`); upstream's admin sidebar is gone. `PremiumLayout` shows `PremiumAdminTabs` (a tab row: Site Settings, Users, Households, Groups, Backups, Maintenance, AI Providers, Parser) on `/admin/*`; the links live in `use-premium-nav.ts` (`admin`), covered by the menu test. On upstream merges, check upstream `layouts/admin.vue` for new admin pages and add them to the list.
- **Settings and admin page styling (v0.3.2):** `cookbook.scss` sets the light theme's `--v-theme-background` to Ivory, so Mealie's section-header cards (`BaseCardSectionTitle`, `color="background"`) blend into the page as upstream intends; those cards get no box edge. Real content cards keep white, 16px corners and 16px inner padding. v0.3.3: section headings Playfair with olive icons; list rows in boxes, flat cards, tables and status boxes (`v-alert`) follow the same card standard.
- **Cook mode on sideways phones and full screen (v0.3.2):** below 500px tall in landscape, the ‹ › arrows are fixed on the left/right edges (centred, clear of the home bar), ingredients and full screen move to the header. Full screen uses the Fullscreen API (Android, iPad, desktop; not iPhone Safari, where the button is hidden): entered automatically on touch devices when Cook mode opens from a tap, exited when it closes. Keyboard focus is trapped inside Cook mode.
- **Design review (v0.3.2; design stack from 2026-11-21):** after building visible changes, run `premium-design-review`, which runs the **design stack**'s `design-review` routine: ui-ux-pro-max (design system check) → frontend-design (new screens only) → impeccable (critique + polish) → web-design-guidelines (usability audit) → webapp-testing (click through, screenshots at every size and theme). This project's profile, which wins over any skill's taste, is `.claude/design-stack.md` (design system, running the app, sizes, project checks). The six stack folders in `.claude/skills/` (`design-review`, `ui-ux-pro-max`, `frontend-design`, `impeccable`, `web-design-guidelines`, `webapp-testing`) are **copies** from the owner's `supergithub-jh/claude-design-stack` repository (version and commit in `.claude/skills/DESIGN-STACK.md`): never edit them here; change the stack repository and re-run its `scripts/sync-skills.sh` on this project. Copies, not a plugin, because cloud sessions don't load plugins a project enables. Findings go in the summary to the owner.
- **Home and Recipes (v0.4.0):** `pages/g/[groupSlug]/index.vue` (small upstream edit) renders `PremiumHome` for the household's own users; a visit with filters in the address (`/g/<group>?tags=…`, which Mealie's tag pages, chips and tables link to) is redirected to the Recipes page with the same filters, and visitors from outside the group still get Mealie's list. The recipe list (Mealie's `RecipeExplorerPage`) lives at `pages/g/[groupSlug]/recipes/index.vue` (new). Home: Recipe of the Week (newest recipe tagged `recipe-of-the-week`, else a weekly pick from all recipes, `weeklyIndex`), Tonight (dinner only; "Surprise me" uses Mealie's random meal plan endpoint), This week (dinners, household's first day of week), Browse chips (`PremiumHomeChips`: automatic pick of Favourites and the most-used tags, categories and tools; the Edit panel saves the user's own list in this browser under `premium-home-chips`, owner's choice), Recently added. Logic in `composables/use-premium-home.ts` (tested). Recipe cards: `PremiumRecipeCard` (4:3 photo, title, time, stars, heart, menu) replaces Mealie's `RecipeCard` in the grid of `RecipeCardSection.vue` (small upstream edit; phones get the grid too, the list view is the desktop toggle); `RecipeCardSection.test.ts` adjusted. List badge: `composables/use-premium-list-count.ts` (unchecked items on all lists, refreshed on navigation, when the app comes back into view and every 2 minutes) in `PremiumSidebar` and `PremiumBottomNav`.
- **Meal Planner and Shopping list (v0.4.1):** `pages/household/mealplan/planner/view.vue` (upstream file, template replaced) renders `PremiumPlannerView` (+ `PremiumPlannerEntry`): one card per day (7 columns from 960px of content width, ~220px columns below, one column under 560px, via container queries), dinner always has a slot, other meal types only when planned, week-long entries in a "For the whole week" strip, entry menu (Cook Mode, Cooking it today, servings via Mealie's `MealPlanScaleControl`, edit and remove via Mealie's dialog/actions). Logic in `composables/use-premium-planner.ts` (tested). Upstream `planner.vue` keeps its toolbar (range, weeks/days, edit, menu) with one small edit: a "Today" button. Editing stays upstream's `planner/edit`. `pages/shopping-lists/[id].vue` (template replaced) renders `PremiumShoppingList`, which uses Mealie's own `useShoppingListPage` for everything (saving, offline queue, sorting, labels, copy, search, recipe links): items grouped by label with big tick boxes; a tick stays crossed out for 4 seconds with "Tap to undo" before it is saved and moves to Done (`composables/use-premium-delayed-check.ts`, tested; flushed when leaving the page); Mealie's `ShoppingListItemEditor` in a panel (bottom sheet on phones); add form: Mealie's `ShoppingListQuickAdd` on top (wide) or `ShoppingListAddItemForm` above the tab bar (phones, `order="1"`); recipes on the list beside it (wide) or below (phones), with −/+ quantity. `pages/shopping-lists/index.vue` (small upstream edit): title row and one card per list with items left and a progress bar (two count requests per list).
- **AI helper (v0.5.0):** the one exception to "frontend only": a separate service in `ai-helper/` (Python, FastAPI; its own image `mealie-ai-helper`, tags `ai-helper-vX.Y.Z`, workflow `.github/workflows/ai-helper-image.yml`, tests in `ai-helper/tests/`). It never touches Mealie's database or code: it checks the user's Mealie login (`GET /api/users/self`) and changes recipes only through Mealie's normal API as that user. Reached at the same address as Mealie under `/ai-helper` (Tailscale serve path / reverse proxy); the dev server forwards it via `frontend/server/routes/ai-helper/[...].ts` (`AI_HELPER_URL`). The OpenAI key lives only in the compose file on Unraid. Frontend: `composables/use-premium-ai-helper.ts` (status checked once, then every 30 min; when the helper is missing every AI feature stays hidden, also when Mealie answers `/ai-helper` with its own page). v0.5.0 AI photos: "Generate image with AI" on the placeholder, a wand button on existing photos (new AI photo, go back to the earlier photo, upload your own); photos 4:3 WebP, tagged `AI image`; the original (or "no photo") kept in the helper's `/data` for going back; `DAILY_IMAGE_LIMIT` per household per day. Model name is a setting (`OPENAI_IMAGE_MODEL`, default `gpt-image-2`).
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
- **Status colours (v0.3.2):** Mealie's defaults fail contrast with white text, so set, in light and dark: `SUCCESS #3E7A3A` (5.2:1), `INFO #3B6B7A` (5.9:1), `WARNING #B5562C` (4.9:1), `ERROR #B3402F` (5.7:1). In the dev compose from v0.1.2; **add them to production's settings at cutover**. Browsers cache the theme: hard-refresh after changing.

**Layout:**
- Desktop/tablet: a light left sidebar (Home, Recipes, Planner, Shopping List, Collections, Settings), with a search bar on top.
- Phone (also sideways) **and portrait tablet** (window narrower than 960px, an explicit width check in `PremiumLayout.vue`, not Vuetify's `md` breakpoint, which starts at 840px): a bottom tab bar with 5 items (Home, Recipes, Planner, List, Collections) and a compact top bar. Import, Recipe Finder, Timeline, organizers and the individual collections are in the profile menu.
- Desktop sidebar: Home, Recipes, Collections, Meal Planner, Shopping List, Import, a collapsed "More" group, Settings at the bottom. **Settings is a menu** (as in upstream): User Settings, Data Management (organizers), Admin Settings (admins → `/admin/site-settings`); the same entries are in the profile menu. Admin pages keep upstream's `admin` layout (its own sidebar), restyled only by colours and fonts. Top bar: search (opens Mealie's search dialog, `/` shortcut), "+ Add Recipe" menu, profile menu.
- **Home** has its own page from v0.4.0; **Recipes** opens the recipe list at `/g/<group>/recipes`.
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
| AI helper tag / image | `ai-helper-vX.Y.Z` → `ghcr.io/<owner>/mealie-ai-helper:vX.Y.Z` (public package) | `ai-helper-v0.5.0` |
| Handed-over files | name + `-vX.Y.Z` | `mealie-cookbook-dev-v0.2.0.yml` |
| Phases | minor version | phase 2 = `v0.2.x` |

`.github/workflows/cookbook-image.yml` builds on `cookbook-v*` tags (amd64 only) and can also be run by hand, which produces a `dev-<sha>` tag. The image package on ghcr.io is **public**, so Unraid pulls it without logging in.

**GitHub Actions setup (done in the GitHub web UI, not in files):**
- Actions are enabled. These 12 upstream workflows are **disabled** (Actions tab → workflow → ⋯ → Disable): Auto-merge dependency PRs, Auto-merge l10n PRs, CodeQL, Deploy Documentation, Automatic Locale Sync, Docker Nightly Production, Pull Request Linter, PR CI, Release Drafter, Docker Build Production, Scheduled Checks, Stale.
- The remaining upstream workflows (Backend/Frontend Lint and Test, Build Containers, Build Package, E2E Tests, Trivy Container Scanning) are `workflow_call` only; they can't start on their own, so they stay enabled.
- Don't delete or edit upstream workflow files; disabling them in the UI avoids merge conflicts.

**Making a release:** Claude Code cloud sessions can push branches but **not tags**. So the owner creates each release in the GitHub web UI: Releases → Draft a new release → tag `cookbook-vX.Y.Z` (create on publish) → target `feature/premium-cookbook` → Publish. That starts the image build. Claude prepares the commit, checks and release notes beforehand.

**Upstream updates:** about once a month, add upstream if missing (`git remote add upstream https://github.com/mealie-recipes/mealie`), `git fetch upstream --tags`, then merge the newest **release tag** (never `mealie-next`), test, and release a patch version. Production is moved to the same Mealie release at the same time (section 7). After each merge: run `pnpm test:ci` (the menu test catches moved pages), and skim upstream changes to `components/Layout/` (header, sidebar, default layout) for new menu items or behaviour worth mirroring in the Premium layout, and to `RecipePage.vue` and the recipe components the Premium views reuse (section 3) for changed props or new view-mode features. Before restoring a production backup into a fork build, confirm production's Mealie version is not ahead of the fork's base in database migrations (`mealie/alembic/versions`).

## 7. Environments

| Environment | Where | Notes |
| --- | --- | --- |
| Production | Official Mealie image `v3.31.0` (pinned release, matches the fork's base) on Unraid, behind the owner's Pangolin reverse proxy (HTTPS) | Never touched by this project until cutover; at cutover only the image changes, Pangolin setup stays |
| Dev copy | `mealie-cookbook-dev` compose stack on Unraid (Compose Manager plugin), image `mealie-cookbook:vX.Y.Z`, SQLite. LAN: `http://<unraid-ip>:9926`. HTTPS: `https://<unraid-tailscale-name>:8443` via `tailscale serve` | Shown as "Mealie Dev" (`BRANDING_NAME`). Not on Pangolin. `BASE_URL` is the Tailscale address. Seeded from a production backup; disable all webhooks and notifiers after **every** restore |
| Local frontend dev | `cd frontend && API_URL=http://<unraid-ip>:9926 pnpm dev` | Live reload against the dev copy's API |

The dev compose file is a handed-over file (`mealie-cookbook-dev-vX.Y.Z.yml`, latest v0.1.2), not committed to the repo.

**HTTPS matters for testing:** Mealie's "Secure Site" check, clipboard (copy buttons) and installing as a phone app (PWA) only work over HTTPS. Test those on the Tailscale address, not the LAN one.

**PWA:** Mealie already ships a PWA manifest (served by the backend). Its app colour follows `THEME_LIGHT_PRIMARY` and its name follows `BRANDING_NAME`. The splash background colour is hard-coded in the backend, so it stays as upstream. Custom icons are possible later as a frontend change.

Checks before every tag: `pnpm lint` and `pnpm test:ci` in `frontend/`, plus a visual check at phone (390px), tablet and desktop widths, in light and dark mode.

## 8. Phase plan

| Phase | Version | Scope | Status |
| --- | --- | --- | --- |
| 1. Setup | v0.1.x | Fork, branch, image workflow, `cookbook.scss`, palette via env, dev copy on Unraid | Done: `cookbook-v0.1.0` released and built; dev copy running with Tailscale HTTPS |
| 2. Theme and navigation shell | v0.2.x | Sidebar (desktop), bottom tab bar (phone), top/search bar, global Vuetify theming, fonts; v0.2.1: "Collection" wording, sidebar descender fix, "Import Tools" menu; v0.2.2: fraction quantities; v0.2.3: Settings menu restored (Admin Settings, Data Management) | `cookbook-v0.2.0` released; v0.2.1–v0.2.3 included in later releases |
| 3. Recipe detail and Cook mode | v0.3.x | Editorial recipe page, servings scaling, ingredient checklist, step view, cook mode with parsed timers and screen wake lock; "Generate image with AI" button (hidden until the helper exists) | Released (v0.3.0–v0.3.3) |
| 4. Main screens | v0.4.x | Home page of its own (**Recipe of the Week**, Tonight, recent, quick filters), Recipes grid, Meal planner, Shopping list (incl. item-count badge on the menu) | Released (v0.4.0–v0.4.2); mockups in the owner's private "Mealie Premium Phase 4 Mockups" page |
| 5. AI helper | v0.5.x | Separate `mealie-ai-helper` container (section 9): video importer, AI recipe images, weekly Recipe of the Week import, AI Recipe Finder (from the web); plus an iOS Shortcut for the Share menu | v0.5.0 built (AI photos). Next: v0.5.1 video importer + iOS Shortcut, v0.5.2 Recipe of the Week (+ optional auto photos for new recipes), v0.5.3 AI Recipe Finder |
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
- Recipe page: layout as the owner's mockup (photo left with Cook Mode under it; title, meta, description and **tabs** Ingredients | Instructions | Notes on the right; stacked on phones).
- Cook mode: follows the app's light/dark setting, with its own sun/moon toggle (remembered on the device). Timers are always adjustable: a detected time opens a "Set timer" panel pre-filled with it (ranges offer both ends as quick picks), minutes and seconds editable, ±1 min; "Add timer" on every step. Several timers run at once, pinned at the top; chime + vibration when done.
- Phase 3 ships as one release, `v0.3.0`.
- Recipe photo: always 4:3, cropped to fit (never stretched), on every screen; sideways phones show it beside the title. No photo in Cook mode (v0.3.1).
- Cook mode timer panel: hours, minutes and seconds (v0.3.1).
- Version line shows the fork's version only (v0.3.2).
- Cook mode goes full screen where browsers allow it (not iPhone Safari) (v0.3.2).
- Admin pages use the normal layout with an admin tab row (v0.3.2).
- After every visible change, run the `premium-design-review` skill before handing over (v0.3.2); from 2026-11-21 it runs the design stack (five skills, in the owner's order), kept in its own repository and copied into each project.
- Phase 4 ships in two steps: v0.4.0 Home, Recipes grid and list badge (released together with v0.3.3), then v0.4.1 Planner and Shopping list.
- Home: Recipe of the Week first on phones, then Tonight; Tonight is dinner only; the list badge counts all lists together; the Browse chips are automatic with an Edit panel, saved per browser (option A, no backend change).
- Planner (v0.4.1): week view, one card per day (desktop 7 columns, phone one column), dinner always has a slot, other meal types only when planned, "+ Add" per day, no "Fill empty dinners" button.
- Background stays plain Ivory (v0.4.2); whitewashed-wood textures were tried and not adopted, possibly revisited later with a real photo.
- Phase 5 (v0.5.0): helper code lives in this repo (`ai-helper/`, own image and tags); AI photos first; reached at the same address as Mealie under `/ai-helper`.
- Shopping list (v0.4.1): add box at the bottom above the tab bar on phones; no recipe tags on items; a ticked item stays crossed out for a few seconds (undo) before moving to Done.

## 11. Changelog

- **v0.5.0** (2026-11-24): phase 5, step 1: AI helper service (`ai-helper/`, image `mealie-ai-helper`) with AI recipe photos: generate on the photo placeholder, wand menu on existing photos (new AI photo, go back to the earlier photo, upload your own), "AI image" tag, daily limit; frontend hides every AI feature when the helper isn't reachable; dev compose v0.1.3 adds the helper container. `use-premium-features.ts` removed.
- **v0.4.2** (2026-11-21): QA batch: one filter-bar look on Recipes and Recipe Finder (sage 44px chips, olive with a count when in use, quiet sort/settings, pill search, filter menus restyled; class hooks `premium-filter-bar` / `premium-filter-menu` / `premium-section-title` in upstream `RecipeExplorerPageSearch.vue`, `SearchFilter.vue`, `recipes/finder/index.vue`). Wood background explored in mockups (owner's private "Mealie Premium Background Options" page), not adopted: the page stays plain Ivory. Multiple labels per item: won't fix (Mealie stores one label per item; needs backend).
- **v0.4.1** (2026-11-21): phase 4, step 2: Meal Planner week view (day cards, week strip, Today button) and Shopping list (grouped by label, delayed tick with undo, Done section, item editor panel, recipes panel, list cards with progress); first build reviewed with the design stack.
- **v0.4.0** (2026-11-19; tooling added 2026-11-21: design stack copied into `.claude/skills/`, project profile `.claude/design-stack.md`, `premium-design-review` now runs it): phase 4, step 1: Home page (Recipe of the Week, Tonight with Cook Mode / Plan tonight / Surprise me, This week, Browse chips with Edit panel, Recently added); Recipes page at `/g/<group>/recipes` with photo cards (`PremiumRecipeCard`), 2 columns on phones; old filtered links redirect there; List badge (items to buy, all lists) in the sidebar and tab bar; recipe list headings in Playfair; faint card edges in dark mode.
- **v0.3.3** (2026-11-19): iPhone sideways Cook mode: arrows and Finish now respond (they were `position: fixed` inside the scrolling Cook mode box, which iOS Safari draws but doesn't tap; now the step text scrolls and the arrows are absolute); admin/settings boxes standardised in `cookbook.scss`: section headings in Playfair with olive icons, 16px padding on list rows in boxes, same soft shadow on flat cards, tables and status boxes, no stray line under tables.
- **v0.3.2** (2026-11-19): Cook mode arrows on sideways phones (side buttons) and full screen; version line shows the fork version only; settings/data/admin pages: Ivory theme background (no white header boxes or overlapping buttons); admin pages in the Premium layout with an admin tab row; keyboard focus trapped in Cook mode; accessible status colours (compose v0.1.2); `premium-design-review` skill.
- **v0.3.1** (2026-11-18): timer hours; consistent 4:3 photo (sideways-phone layout), no photo in Cook mode; tab bar on sideways phones (explicit 960px switch); version line; illustrated profile pictures; Bulk Import with CSV template and export. QA items: version line, profile pictures, bulk import.
- **v0.3.0** (2026-11-16): phase 3 built: Premium recipe page (tabs), Cook mode (step view, timers with manual entry, ingredients panel, wake lock, own light/dark toggle, remembers step), photo placeholder with hidden AI-image button; page descriptions back to Inter.
- **v0.2.4** (2026-11-16): QA list workflow (private "Mealie Premium QA" page).
- **v0.2.3** (2026-11-16): Settings is a menu again (User Settings, Data Management, Admin Settings by permission); fixes Site Settings being unreachable since v0.2.0.
- **v0.2.2** (2026-11-16): quantities, servings and yield accept fractions ("3/8 cup").
- **v0.2.1** (2026-11-16): "Collection" wording via `premium-terms.ts`; "Import Tools" menu; sidebar descender fix; Recipe of the Week and AI Recipe Finder added to the plan.
- **v0.2.0** (2026-11-16): phase 2 built (Premium layout, menu, fonts committed); branding "Mealie Premium" / "Digital Cookbook"; phase 2 decisions; phase 5 becomes `mealie-ai-helper` with AI recipe images.
- **v0.1.2** (2026-11-16): production switched from `nightly` to `v3.31.0`.
- **v0.1.1** (2026-11-16): phase 1 done; repo name; GitHub Actions setup and release process (owner creates tags in the web UI); dev copy details (compose stack, Tailscale HTTPS, "Mealie Dev", webhook rule); PWA notes; production pinned to release tags.
- **v0.1.0** (2026-11-14): first handoff.
