---
title: Generalize slot-lifting for nested components in islands
project: ui-components
status: To Do
priority: High
assignee: Sam Okafor
dueDate: 2026-08-10
tags:
  - bug
  - hydration
---

Components passed as JSX children/props into an island get DOM-cloned on hydration instead of re-executed, so nested hooks stay dead client-side. This was fixed for Tabs via slot-lifting (`__slot_N_field`), but Splitter still drops nested custom components (e.g. Carousel) on hydration and is limited to `interactive={false}` as a workaround. Apply the same slot-lifting fix to Splitter and audit other multi-slot islands for the same gap.
