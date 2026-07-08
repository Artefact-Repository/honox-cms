# Tabs

# Introduction

A set of layered sections of content shown one at a time, with a selectable tab list.

# Props

## Tabs

| Prop | Type | Description |
| :--- | :--- | :--- |
| `items` | `TabsItem[]` | The tabs to render (used when no children are provided). |
| `indicator` | `boolean` | Whether to show the active indicator. Default: `true`. |
| `interactive` | `boolean` | Enable client-side hydration. Default: `true`. |
| `class` | `string` | Custom CSS classes for the root element. |

Additional tab state props (e.g. `value`, `defaultValue`, `onValueChange`, `orientation`) are forwarded to the underlying tabs primitive.

### TabsItem

| Property | Type | Description |
| :--- | :--- | :--- |
| `value` | `string` | Unique identifier for the tab. |
| `label` | `string \| JSX.Element` | The tab label. |
| `content` | `string \| JSX.Element` | The panel content shown when active. |
| `disabled` | `boolean` | Whether the tab is disabled. |

# Hydration

**Tier 2 — smart auto-detect.** A bare `Tabs` (no selection state) renders as static HTML and ships no client JS. To get a working, switchable tablist, provide a behavioral signal or force hydration. Pass `interactive={true}` to always hydrate, or `interactive={false}` to force a static render.

It hydrates as an island when **any** of the following signals is present (or `interactive={true}` is set):

- `value` (controlled selection)
- `defaultValue` (uncontrolled initial selection)
- `onValueChange`

> Note: a `<Tabs items={…} />` with none of these signals renders the first tab statically — no switching. Add `defaultValue` (or `value` / `onValueChange`) for interactivity.

| `interactive` prop | Result |
| :--- | :--- |
| omitted, **no** signal | Static — no client JS |
| omitted, a signal present | Hydrates as an island |
| `true` | Hydrates as an island |
| `false` | Static — no client JS |

All interactivity decisions in the library route through the shared `shouldHydrate()` helper in `app/components/ui/island-utils.ts`.

# Usage

## Basic Tabs

```tsx
import { Tabs } from "../components/ui";

export default function MyPage() {
  return (
    <Tabs
      items={[
        { value: "tab1", label: "Tab 1", content: "Content for tab 1" },
        { value: "tab2", label: "Tab 2", content: "Content for tab 2" },
      ]}
    />
  );
}
```
