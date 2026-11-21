---
name: premium-design-review
description: Design and accessibility review for Mealie Premium (the fork's "Digital Cookbook" look). Use after building or changing any screen in this fork, before handing a build to the owner. Runs the design stack's design-review routine with this project's design profile.
---

# Mealie Premium design review

Run the **`design-review`** skill (the design stack, in `.claude/skills/design-review/`). Its five steps
are ui-ux-pro-max, frontend-design, impeccable, web-design-guidelines and webapp-testing.

This project's design profile, which the routine reads first and which wins over any skill's taste, is
**`.claude/design-stack.md`**: design system, how to run the app, sizes and themes, and the project
checks (960px layout switch, 4:3 photos, contrast in both themes, Cook mode and upstream-screen rules).

The stack's skill folders are copies; don't edit them here. To update them, change the
`claude-design-stack` repository and re-run its `scripts/sync-skills.sh` on this project
(see `.claude/skills/DESIGN-STACK.md`).
