---
title: Add a CI check that registry block types match the CMS schema
project: cms-page-builder
status: To Do
priority: Medium
assignee: Sam Okafor
dueDate: 2026-10-10
tags:
  - cms
  - engineering
  - ci
---

The block type set lives in two hand-kept places that can drift apart:
- `app/components/page-registry.tsx`'s `registry` object (the runtime renderers), and
- `public/admin/config.yml`'s `&root_components` / `&nestable_components` / `&leaf_components` YAML anchors (the editor's offered block types).

If a type is added to one but not the other, the mismatch degrades silently: a CMS-authored block with no registry entry now renders as an inert `<div data-unknown-component>` (`renderUnknown` in page-registry), and a registry entry with no schema field is simply unreachable from the editor. Neither fails the build.

Add a lightweight CI step (or a `scripts/` check) that parses the `blockType` names from `config.yml` and the `registry` keys from `page-registry.tsx`, diffs them, and fails on any type missing on either side. Cheap insurance against silent content breakage as the block library grows past 40 types.
