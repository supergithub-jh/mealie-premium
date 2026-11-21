---
name: design-review
description: The design stack's routine for any change people will see in a web app's UI. Runs five skills in order (ui-ux-pro-max, frontend-design, impeccable, web-design-guidelines, webapp-testing) against the project's own design profile (.claude/design-stack.md), fixes what they find, and reports. Use after building or changing screens, before handing work to the owner, or when asked for a design review, polish or UI audit.
---

# Design review (design stack)

One routine, five skills, in this order. Each project brings its own **design profile**; the profile
always wins over a skill's general taste.

## 0. Load the project's design profile

Read `.claude/design-stack.md` in the project root. It says:

- where the **design system** lives (palette, type, shapes, layout rules) and anything it must never change;
- how to **start the app** and log in, and which test data to use;
- the **screen sizes and themes** to check;
- **project checks** that apply on top of this routine.

No profile? Stop and ask the owner. Offer to write one, with step 1 helping only if the project has no
design system yet. Never invent a design direction for an existing product without the owner.

Decide the **scope** from the change:

| Change | Steps |
| --- | --- |
| New screen, or a screen reshaped | 1 → 5 |
| Change to existing screens | 1 (rules only), 3, 4, 5 |
| Copy, colour or spacing fix | 4, 5 |

## 1. Design system check: `ui-ux-pro-max`

- The profile's design system is the source of truth. **Do not generate or replace a design system**
  when the profile defines one.
- Use the skill's rules as a checklist for the changed screens: read `references/quick-reference.md`
  (priority 1–10) and `references/pro-rules.md` (pre-delivery checklist).
- For a new screen type (planner, list, form, dashboard), run its search for UX patterns of that kind,
  e.g. `python3 <ui-ux-pro-max skill dir>/scripts/search.py "meal planner week view" --domain ux`, and
  apply what fits the profile.
- Only when a project has **no** design system: use `--design-system` to propose one, and show it to
  the owner before building with it.

## 2. New screens: `frontend-design`

- Only for new or reshaped screens. Follow its process: short plan (tokens, layout sketch, principles),
  check the plan against the profile, then build.
- **The profile is the brief.** Where the profile pins palette, fonts, shapes or layout, follow it
  exactly, even if the skill lists that look as a "generated default". Spend boldness only where the
  profile leaves room, in one place per screen.

## 3. Critique and polish: `impeccable`

- Read its `reference/critique.md` (with `critique-rubric.md`) and critique the changed screens from the
  screenshots; app screens are **Operate** mode (precision and restraint), content pages **Read**.
- Then `reference/polish.md` and `reference/craft-floor.md` before editing; fix what is clearly a defect
  or off-profile. This copy has no launcher: follow its "Launcher unavailable" path silently.

## 4. Usability audit: `web-design-guidelines`

- Read its `references/command.md` and audit the changed files (components, pages, styles).
- Fix findings that apply; note the ones that conflict with the profile or the framework, with why.

## 5. Test in the browser: `webapp-testing`

- Start the app as the profile says. Use the skill's approach: reconnaissance first (screenshot,
  DOM), then actions. If Python Playwright is not installed but Node Playwright is, write the same
  scripts in Node; don't install a second browser.
- Screenshot every changed screen at the profile's sizes, in light and dark. Use device emulation for
  touch behaviour (taps, swipes, sideways phones).
- Walk the main flow of each change by clicking; check the browser console for errors and warnings.
- Run the profile's **project checks**.

## 6. Fix, re-check, report

- Fix defects, then re-run step 5 on what changed.
- Tell the owner, briefly and in plain language: what was checked, what was found and fixed, and what is
  left as a suggestion and why (e.g. it would need changes to upstream code the project avoids).
