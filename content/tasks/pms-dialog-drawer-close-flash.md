---
title: PMS — Dialog/Drawer close-animation flash — regression guard
project: pms
status: Draft
priority: Medium
assignee: Diego Ramos
dueDate: 2026-09-30
tags: [pms, ui, dialog, drawer, bug, regression]
---

## Context

The Dialog (and Drawer) components had a close bug: on close, the **dark backdrop snapped away instead of fading** — reading as a "flash" of background color. This is a shared design-system component (`app/components/ui/dialog-primitive.tsx`, `app/components/ui/drawer-primitive.tsx`) used across the whole app, including the PMS task/project create-edit-drawers, `TaskRowActionsMenu`, delete dialogs, etc.

**The bug is already fixed in code** (applied earlier this session). This task exists to (1) lock the fix in with a regression test so it can't silently re-break, and (2) record the root cause. No UI change is required — the remaining work is test + verification.

## Root cause (recap)

In `InteractiveDialog`/`InteractiveDrawer`, the *mount flag* (`renderOpen`) was passed down to `Root` as `open`. The parts (`Backdrop`/`Positioner`/`Content`) derived **both** `data-state` and `display:none` from that single value. But `useOverlay.hide()` also sets `data-state="closed"` *imperatively* to kick off the `_closed` exit animation (`app/components/ui/overlay-a11y.ts`).

On close: your intent `open` flipped to `false`, React re-rendered and reset `data-state` back to `"open"` (because `renderOpen` was still `true` during the exit window), **overwriting** the imperative `"closed"`. The exit animation never started — the backdrop stayed visible until `whenAnimationEnds`'s timeout, then got `display:none !important` and snapped shut. That abrupt vanish is the "flash."

## The fix (already applied)

Decoupled **intent** (`open`) from the **mount flag** (`mounted`):
- Added `mounted?: boolean` to the context + `Root` props in both primitives.
- The parts now set `data-state` from `open` (intent) and `display:none` from `mounted` (mount flag); standalone `Root` usage defaults `mounted` to `open`.
- `InteractiveDialog`/`InteractiveDrawer` pass `open={open}` **and** `mounted={renderOpen}`.

Result: on close, `data-state` → `"closed"` while the node stays mounted (`display` not yet `none`); the `_closed` animation plays; only after it finishes does `renderOpen` flip and the node unmounts. Smooth fade, no flash.

Key lines: `dialog-primitive.tsx` context/Root (`mounted` at :24/:41/:53/:66); `Backdrop` :122/:129, `Positioner` :150/:160, `Content` :185/:234; `InteractiveDialog` `mounted={renderOpen}` at :517. Drawer mirrors at :24/:41/:53/:66, :120/:127, :146/:159, :184/:233, :498.

## Remaining work (this task)

1. **Regression test.** The existing `app/components/ui/dialog.unit.test.tsx` + `drawer.unit.test.tsx` only assert the static `open={false}` render path — they do **not** exercise the close transition. Add a test that drives the close sequence and asserts:
   - After the close intent fires, `data-state="closed"` is present on the backdrop/content **while** `display` is not yet `none` (i.e. `mounted` still true).
   - The node only gets `display:none` after the animation-end / `whenAnimationEnds` timeout, not synchronously on close.
   - This catches any future reversion where `data-state` and `display` are re-coupled to one flag.
2. **Visual verification note.** The CSS exit animation itself can't be asserted in jsdom; add a comment in the test (and a manual-check step) that a browser eyeball of open+close on a task dialog is the final confirmation. The earlier fix was verified via Biome lint (clean) + all 9 Dialog/Drawer unit tests passing, but not via a live browser.
3. **Optional doc.** One-line comment already exists at `dialog-primitive.tsx:22-23` / `drawer-primitive.tsx:22-23` explaining the intent-vs-mount split — sufficient; no separate doc needed.

## Acceptance criteria

- New test(s) in `dialog.unit.test.tsx` / `drawer.unit.test.tsx` fail if `data-state` and `display:none` are re-coupled to a single flag (i.e. they guard the specific fix).
- All Dialog/Drawer unit tests pass.
- A note records that the fix is live and the close flash is resolved (no code change needed).

## Notes

- Shared component — the fix and this guard benefit the entire app, not just PMS, even though the task is filed under `pms` because dialogs are prominent there.
- No new dependencies; pure test/verification addition.
