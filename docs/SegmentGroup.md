# SegmentGroup

# Introduction

A mutually exclusive selection control that displays a set of options as a single segmented unit (radio-group style).

# Props

## SegmentGroup

| Prop | Type | Description |
| :--- | :--- | :--- |
| `items` | `SegmentGroupItem[]` | The options to render (used when no children are provided). |
| `value` | `string` | The selected value (controlled). |
| `defaultValue` | `string` | The initial selected value (uncontrolled). |
| `onValueChange` | `(value: string) => void` | Callback triggered when the selection changes. |
| `orientation` | `"horizontal" \| "vertical"` | Layout direction. Default: `"horizontal"`. |
| `disabled` | `boolean` | Whether the group is disabled. |
| `name` | `string` | Form field name for the underlying radio inputs. |
| `interactive` | `boolean` | Enable client-side hydration. Default: smart auto-detect. |
| `class` | `string` | Custom CSS classes for the root element. |

Additional props (e.g. `readOnly`, `id`) are forwarded to the underlying segment-group primitive.

### SegmentGroupItem

| Property | Type | Description |
| :--- | :--- | :--- |
| `value` | `string` | Unique value for the segment. |
| `label` | `string \| JSX.Element` | The segment label. |
| `disabled` | `boolean` | Whether the segment is disabled. |

# Hydration

**Tier 2 — smart auto-detect.** A bare `SegmentGroup` (no selection state) renders as static HTML and ships no client JS. To get a working, switchable group, provide a behavioral signal or force hydration. Pass `interactive={true}` to always hydrate, or `interactive={false}` to force a static render.

It hydrates as an island when **any** of the following signals is present (or `interactive={true}` is set):

- `value` (controlled selection)
- `defaultValue` (uncontrolled initial selection)
- `onValueChange`

> Note: a `<SegmentGroup items={…} />` with none of these signals renders the first segment statically — no switching. Add `defaultValue` (or `value` / `onValueChange`) for interactivity.

| `interactive` prop | Result |
| :--- | :--- |
| omitted, **no** signal | Static — no client JS |
| omitted, a signal present | Hydrates as an island |
| `true` | Hydrates as an island |
| `false` | Static — no client JS |

All interactivity decisions in the library route through the shared `shouldHydrate()` helper in `app/components/ui/island-utils.ts`.

# Usage

## Basic SegmentGroup

```tsx
import { SegmentGroup } from "../components/ui";

export default function MyPage() {
  return (
    <SegmentGroup
      defaultValue="daily"
      items={[
        { value: "daily", label: "Daily" },
        { value: "weekly", label: "Weekly" },
        { value: "monthly", label: "Monthly" },
      ]}
    />
  );
}
```
