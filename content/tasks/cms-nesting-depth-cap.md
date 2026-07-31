---
title: Document and relax the CMS nesting-depth cap
project: cms-page-builder
status: To Do
priority: Medium
assignee: Diego Ramos
dueDate: 2026-10-20
tags:
  - cms
  - page-builder
  - ux
---

The CMS editor caps buildable nesting at ~4 levels: `public/admin/config.yml` unrolls nesting with YAML anchors (`&root_components` → `&nestable_components` → `&leaf_components`), so a non-technical editor can nest containers only about three levels deep before hitting leaves. `content/docs/PageBuilder.md` notes this is an editor-UI limit only — `renderChildren` recursion in `page-registry.tsx` has no depth limit, so hand-edited JSON renders fine — but editors building complex dashboard pages (e.g. the `dashboard.json` example, or `tasks.json`) hit the wall and have no escape except editing raw JSON.

Two tracks: (a) document the cap clearly in `content/docs/PageBuilder.md` (with a few pre-built "deep pattern" starter blocks editors can drop in), and (b) investigate whether the schema can support deeper or truly-recursive nesting (the `menu` block already does one level of self-referencing `items` nesting via Sveltia's list widget) so power editors aren't forced into raw JSON. Medium effort, high payoff for complex-page authors.
