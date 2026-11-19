---
name: premium-design-review
description: Design and accessibility review for Mealie Premium (the fork's "Digital Cookbook" look). Use after building or changing any screen in this fork, before handing a build to the owner: screenshot the changed screens at every size and theme, check them against the fork's design system and this checklist, run the design critique and accessibility review, fix what you find, and list the findings in your summary.
---

# Mealie Premium design review

Run this after every build that changes what people see, **before** telling the owner it's ready.
The design system is in `cookbook/HANDOFF.md` section 4; this file is the checklist that applies it.

## 1. Screenshot every changed screen

Start the app as in the `frontend-e2e` skill (log in, seed realistic data). For each changed screen take:

| Size | Viewport | Notes |
| --- | --- | --- |
| Phone | 390×844 | tab bar layout |
| Phone sideways | 844×390 | still tab bar (layout switches at 960px) |
| Tablet | 768×1024 | tab bar layout |
| Tablet sideways | 1024×768 | sidebar layout |
| Desktop | 1280×860 | sidebar layout |

Each in **light and dark** (dark: profile menu → Dark Mode). For touch behaviour (taps, swipes, sideways
phones, safe areas) also run a Playwright script with `devices["iPhone 13 landscape"]` /
`devices["Pixel 7 landscape"]`; the MCP browser has no touch emulation.

Use realistic content: a real food photo **and** a tall portrait photo (`tests/data/images/test-image-1.jpg`,
crop a portrait copy), a recipe with **no** photo, long names, ingredient sections, empty lists.
Never commit test photos or personal data.

## 2. Checklist

**Palette and theme**
- [ ] Colours come from the palette (Ivory `#FAF7F2` page, Sage `#E5EAD5` soft fills, Olive `#536B32`
      primary, Espresso `#322C25` text, White cards) or theme variables; no stray Mealie blue/green/orange
      on fork screens (flag upstream screens that still use them).
- [ ] Dark mode: every element readable; soft fills use `--premium-soft`, not light-only colours.
- [ ] Nested themes (Cook mode dark inside a light app) pick up the **nearest** theme.

**Type**
- [ ] Headings and recipe titles in Playfair Display; body, labels, buttons and running text in Inter.
- [ ] No long paragraph in Playfair (Mealie's `h3.subtitle-1` descriptions must stay Inter).
- [ ] No clipped descenders (p, g, q) or truncated labels; long names wrap or ellipsis deliberately.

**Shape and spacing**
- [ ] Cards: 16px corners, soft shadow, 16px inner padding; text never touching a box edge.
- [ ] Mealie's section headers (background-coloured cards) are plain headings: no visible box, nothing
      overlapping them.
- [ ] Buttons are pills (except icon buttons, button groups, the tab bar); spacing via gap, consistent.

**Photos**
- [ ] Recipe photos are 4:3, `object-fit: cover`, never stretched, on every size; sideways phones show
      them beside the title; every photo slot has the designed placeholder when there's no photo.

**Layout**
- [ ] Below 960px: compact top bar + bottom tab bar; from 960px: sidebar. Nothing hidden behind bars.
- [ ] Primary actions reachable without scrolling on phones, including sideways (thumb-reachable,
      not in the home-bar/toolbar zone at the very bottom edge).
- [ ] No horizontal page scroll; wide tables scroll inside their box.

**Accessibility (WCAG 2.1 AA)**
- [ ] Text contrast ≥ 4.5:1 (≥ 3:1 for 24px+ or bold 18.66px+), in both themes.
- [ ] Touch targets ≥ 44×44px.
- [ ] Everything works by keyboard; visible focus; icon-only buttons have `aria-label`.
- [ ] Overlays (Cook mode, dialogs) keep focus inside and make the page behind inert.

**Behaviour**
- [ ] No console errors or Vue warnings on the changed screens.
- [ ] Settings, admin and data pages still reachable from the menus (sidebar, profile menu, admin tabs).

## 3. Critique and accessibility pass

Load the `design:design-critique` skill and review the screenshots (hierarchy, consistency with the
mockups and the rest of the app, usability), then `design:accessibility-review` (contrast, targets,
keyboard, screen readers). Measure contrast with real values (computed colours), not by eye.

## 4. Fix, then report

- Fix everything that's clearly a defect or off-system in fork code before handing over.
- Upstream Mealie screens: fix through `cookbook.scss` or theme variables where it's safe; otherwise
  list it as a suggestion for the owner rather than editing upstream files.
- In the summary to the owner, list: what the review checked, what it found and fixed, and anything
  left as a suggestion (with why). Keep it short and plain.
