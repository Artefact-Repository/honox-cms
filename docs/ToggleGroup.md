# ToggleGroup

# Introduction

A multi-select control that displays a set of toggle buttons, allowing one or more to be active at a time.

# Props

## ToggleGroup

| Prop | Type | Description |
| :--- | :--- | :--- |
| `items` | `ToggleGroupItem[]` | The options to render (used when no children are provided). |
| `value` | `string[]` | The selected values (controlled). |
| `defaultValue` | `string[]` | The initial selected values (uncontrolled). |
| `onValueChange` | `(value: string[]) => void` | Callback triggered when the selection changes. |
| `multiple` | `boolean` | Whether multiple values can be selected. Default: `true`. |
| `orientation` | `"horizontal" \| "vertical"` | Layout direction. Default: `"horizontal"`. |
| `disabled` | `boolean` | Whether the group is disabled. |
| `interactive` | `boolean` | Enable client-side hydration. Default: smart auto-detect. |
| `class` | `string` | Custom CSS classes for the root element. |

### ToggleGroupItem

| Property | Type | Description |
| :--- | :--- | :--- |
| `value` | `string` | Unique value for the toggle. |
| `label` | `string \| JSX.Element` | The toggle label. |
| `disabled` | `boolean` | Whether the toggle is disabled. |

# Hydration

**Tier 2 — smart auto-detect.** A bare `ToggleGroup` (no selection state) renders as static HTML and ships no client JS. To get a working, switchable group, provide a behavioral signal or force hydration. Pass `interactive={true}` to always hydrate, or `interactive={false}` to force a static render.

It hydrates as an island when **any** of the following signals is present (or `interactive={true}` is set):

- `value` (controlled selection)
- `defaultValue` (uncontrolled initial selection)
- `onValueChange`

> Note: a `<ToggleGroup items={…} />` with none of these signals renders the toggles statically — no activation. Add `defaultValue` (or `value` / `onValueChange`) for interactivity.

| `interactive` prop | Result |
| :--- | :--- |
| omitted, **no** signal | Static — no client JS |
| omitted, a signal present | Hydrates as an island |
| `true` | Hydrates as an island |
| `false` | Static — no client JS |

All interactivity decisions in the library route through the shared `shouldHydrate()` helper in `app/components/ui/island-utils.ts`.

# Usage

## Basic ToggleGroup

```tsx
import { ToggleGroup } from "../components/ui";

export default function MyPage() {
  return (
    <ToggleGroup
      defaultValue={["bold"]}
      items={[
        { value: "bold", label: "Bold" },
        { value: "italic", label: "Italic" },
        { value: "underline", label: "Underline" },
      ]}
    />
  );
}
```
