# Mealie Premium Cookbook: Project Handoff (v0.1.0)

Handoff for Claude Code working in this fork. Written 2026-11-14.
Save in the repo as `cookbook/HANDOFF.md` and add `@cookbook/HANDOFF.md` as the first line of `CLAUDE.md`, so it loads automatically.

## 1. What this project is

A personal fork of [Mealie](https://github.com/mealie-recipes/mealie) that restyles the web app into a warm, editorial, cookbook-like experience ("Premium Cookbook"). It is for one household, running on the owner's Unraid server.

- **Base:** Mealie release `v3.31.0` (Nuxt 4 + Vue 3 + Vuetify frontend, FastAPI backend).
- **Branch:** `feature/premium-cookbook`.
- **Scope:** the frontend only. Mealie's backend, API and database stay exactly as upstream.

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

- **Type:** Playfair Display for headings and recipe titles; Inter for body text and UI. Bundle them through Mealie's existing `@nuxt/fonts` (no CDN; the app must work offline).
- **Shape:** 16–20px card radius, soft shadow `0 4px 16px rgba(50,44,37,0.06)`, generous whitespace, photo-first cards.
- **Brand colors** are set with Mealie's `THEME_LIGHT_*` / `THEME_DARK_*` environment variables (see the compose file). The Ivory background, fonts and shapes are in `cookbook.scss`.

**Layout:**
- Desktop/tablet: a light left sidebar (Home, Recipes, Planner, Shopping List, Collections, Settings), with a search bar on top.
- Phone: a bottom tab bar with 5 items (Home, Recipes, Planner, List, plus Collections or Import, to be decided in phase 2) and a compact top bar.
- Same look on both, different layout. Use Vuetify's display breakpoints (`useDisplay`).

## 5. What Mealie can and can't supply

Design around the real data:

| Mockup feature | Reality | Approach |
| --- | --- | --- |
| Pantry | Doesn't exist in Mealie | Out of scope; a possible later separate project |
| Review counts ("4.8 (312)") | Ratings are per user, no counts | Show the household's own stars only |
| Notification bell | No notification feed | Leave it out |
| Recipe of the Day | No such endpoint | Tonight's meal plan entry, otherwise a random favorite (client-side) |
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

`.github/workflows/cookbook-image.yml` builds on `cookbook-v*` tags (amd64 only) and can also be run by hand, which produces a `dev-<sha>` tag. The upstream Mealie workflows are disabled in the fork.

**Upstream updates:** about once a month, `git fetch upstream --tags`, then merge the newest **release tag** (never `mealie-next`), test, and tag a patch version. Before restoring a production backup into a fork build, confirm production's Mealie version is not ahead of the fork's base in database migrations (`mealie/alembic/versions`).

## 7. Environments

| Environment | Where | Notes |
| --- | --- | --- |
| Production | Official Mealie `nightly` image on Unraid, behind the owner's reverse proxy | Never touched by this project until cutover |
| Dev copy | `mealie-cookbook-dev` container on Unraid, port 9926, LAN only, SQLite | Seeded from a production backup; notifiers and webhooks disabled |
| Local frontend dev | `cd frontend && API_URL=http://<unraid-ip>:9926 pnpm dev` | Live reload against the dev copy's API |

Checks before every tag: `pnpm lint` and `pnpm test:ci` in `frontend/`, plus a visual check at phone (390px), tablet and desktop widths, in light and dark mode.

## 8. Phase plan

| Phase | Version | Scope | Status |
| --- | --- | --- | --- |
| 1. Setup | v0.1.x | Fork, branch, image workflow, `cookbook.scss`, palette via env, dev copy on Unraid | Patch ready (`mealie-cookbook-phase1-v0.1.0.patch`); not yet built |
| 2. Theme and navigation shell | v0.2.x | Sidebar (desktop), bottom tab bar (phone), top/search bar, global Vuetify theming, fonts | Next |
| 3. Recipe detail and Cook mode | v0.3.x | Editorial recipe page, servings scaling, ingredient checklist, step view, cook mode with parsed timers and screen wake lock | Planned |
| 4. Main screens | v0.4.x | Home (Tonight / Recipe of the Day, recent, quick filters), Recipes grid, Meal planner, Shopping list | Planned |
| 5. Video importer | v0.5.x | Separate sidecar container (section 9) plus an iOS Shortcut for the Share menu | Planned |
| 6. Test and cutover | v1.0.0 | Full checks, production backup, switch production to the fork image, keep the official image for rollback | Planned |

## 9. Phase 5 preview: video importer

A small separate service (`mealie-video-importer`), not a change to Mealie's backend:

1. Receives a Reel, TikTok or YouTube Shorts link.
2. Reads the caption and description first; many already contain the recipe.
3. If needed, downloads the clip with `yt-dlp`, extracts the audio and transcribes it (OpenAI, which the owner already uses).
4. Has the AI model produce a schema.org Recipe and creates it through Mealie's API with a Mealie API token.
5. Auto-updates `yt-dlp`; supports an optional Instagram cookies file.

The Import screen gets Link / Photo / Video options. iOS can't share into a web app, so an iOS Shortcut sends shared links to the importer.

## 10. Open decisions

- The 5th phone tab: Collections or Import (phase 2).
- Whether to switch production from `nightly` to release tags (recommended).
- Pantry: deferred to a separate future project; it would need backend work.
