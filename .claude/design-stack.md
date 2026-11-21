# Design profile: Mealie Premium

Read by the design stack's `design-review` skill (`.claude/skills/design-review/`). This file is the
brief: where it pins something, it wins over any skill's general taste.

## Design system (source of truth)

`cookbook/HANDOFF.md` section 4, applied in `frontend/app/assets/cookbook.scss`:

- Palette: Ivory `#FAF7F2` page, Sage `#E5EAD5` soft fills (`--premium-soft` in both themes), Olive
  `#536B32` primary, Espresso `#322C25` text, White cards. Dark mode: primary `#A3B86C` on Mealie's dark
  background. Status colours (`#3E7A3A`, `#3B6B7A`, `#B5562C`, `#B3402F`) come from the `THEME_*` settings.
- Type: Playfair Display for headings and recipe titles; Inter for body, labels, buttons and running text.
  No long paragraph in Playfair (Mealie's `h3.subtitle-1` descriptions stay Inter).
- Shape: cards 16–20px corners, soft shadow `0 4px 16px rgba(50,44,37,0.06)`, 16px inner padding; pill
  buttons (not icon buttons, button groups or the tab bar).
- Photos: recipe photos always 4:3, `object-fit: cover`, never stretched; every photo slot has the
  designed placeholder (`PremiumRecipeImage`).
- Layout: below 960px a compact top bar and bottom tab bar; from 960px the sidebar (explicit width check
  in `PremiumLayout.vue`).
- **Never change** without the owner: the palette, the two fonts, the layout switch, the approved
  mockups (owner's private "Mealie Premium Phase 4 Mockups" page) and every decision in HANDOFF
  section 10. The warm cream + serif look is the brief, not a generated default.
- Work rules (HANDOFF section 3): frontend only, fork work in `components/Domain/Premium/` and
  `cookbook.scss`, small upstream edits only, English strings through i18n.

## Running the app

As in the `frontend-e2e` skill: backend `uv run python mealie/app.py` with the env from `mise.toml`
(`mise` is not installed in cloud sessions, so export the variables by hand) plus the `THEME_*` palette
and status colours and `BRANDING_NAME='Mealie Premium'`; frontend `cd frontend && pnpm dev` (port 3000).
Log in with `changeme@example.com` / `MyPassword` (POST `/api/auth/token`).

Test data: a recipe with a real food photo (`tests/data/images/test-image-1.jpg`) **and** a tall portrait
photo (crop a portrait copy), a recipe with **no** photo, long names, ingredient sections, empty lists,
meal plan entries for this week, shopping list items. Never commit test photos or personal data.

Playwright: Node Playwright is preinstalled (`require('playwright')`, Chromium only); don't install
browsers. Screenshots go to `.playwright-mcp/`. Dark mode: `colorScheme: "dark"` on the browser context.

## Sizes and themes

| Size | Viewport | Notes |
| --- | --- | --- |
| Phone | 390×844 | tab bar layout |
| Phone sideways | 844×390 | still tab bar |
| Tablet | 768×1024 | tab bar layout |
| Tablet sideways | 1024×768 | sidebar layout |
| Desktop | 1280×860 | sidebar layout |

Each in light and dark. Touch behaviour (taps, swipes, sideways phones, safe areas): device emulation
with `devices["iPhone 13 landscape"]` / `devices["Pixel 7 landscape"]`. Note that this is Chromium:
Safari-only behaviour (e.g. iOS hit-testing, full screen) needs the owner's real iPhone.

## Project checks

- Colours only from the palette or theme variables on fork screens; flag upstream screens still using
  Mealie blue/green/orange. Dark mode: everything readable; nested themes (Cook mode) use the nearest theme.
- No clipped descenders or truncated labels; long names wrap or ellipsis on purpose.
- Mealie's section headers (background-coloured cards) are plain headings: no box, nothing overlapping.
- Primary actions reachable without scrolling on phones, including sideways, and not in the home-bar zone.
- No horizontal page scroll; wide tables scroll inside their box.
- WCAG 2.1 AA: text ≥ 4.5:1 (3:1 for large text) measured from computed colours in both themes; touch
  targets ≥ 44×44px; keyboard works with visible focus; icon-only buttons have `aria-label`; overlays keep
  focus inside.
- No console errors or Vue warnings on the changed screens.
- Settings, admin and data pages still reachable (sidebar, profile menu, admin tabs).
- Before handing over: `pnpm lint` and `pnpm test:ci` in `frontend/`; the summary to the owner is short
  and plain, and upstream screens are fixed through `cookbook.scss` or theme variables where safe,
  otherwise listed as suggestions.
