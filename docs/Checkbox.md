# Checkbox

# Introduction

A control that allows the user to toggle between checked, unchecked, and indeterminate states.

# Props

| Prop              | Type                                                         | Description                                        |
| :---------------- | :----------------------------------------------------------- | :------------------------------------------------- |
| `children`        | `any`                                                        | Label content to be rendered next to the checkbox. |
| `class`           | `string`                                                     | Custom CSS classes.                                |
| `checked`         | `boolean \| "indeterminate"`                                 | Whether the checkbox is checked (controlled).      |
| `defaultChecked`  | `boolean \| "indeterminate"`                                 | The initial checked state (uncontrolled).          |
| `disabled`        | `boolean`                                                    | Whether the checkbox is disabled.                  |
| `onCheckedChange` | `(details: { checked: boolean \| "indeterminate" }) => void` | Callback triggered when the checked state changes. |
| `size`            | `"sm" \| "md" \| "lg"`                                       | The size of the checkbox.                          |
| `interactive`     | `boolean`                                                    | Forces hydration as an island.                     |

# Hydration

**Tier 2 — smart auto-detect.** A `Checkbox` renders as static HTML and ships no client JS unless a behavioral signal is present. Pass `interactive={true}` to force hydration, or `interactive={false}` to force a static render.

It hydrates as an island when **any** of the following signals is present (or `interactive={true}` is set):

- `onCheckedChange`
- `checked` (controlled)
- `defaultChecked` (uncontrolled initial state)

| `interactive` prop | Result |
| :--- | :--- |
| omitted, **no** signal | Static — no client JS |
| omitted, a signal present | Hydrates as an island |
| `true` | Hydrates as an island |
| `false` | Static — no client JS |

All interactivity decisions in the library route through the shared `shouldHydrate()` helper in `app/components/ui/island-utils.ts`.

# Usage

```tsx
import { Checkbox } from "../components/ui";

export default function MyPage() {
  return (
    <Checkbox
      defaultChecked={true}
      onCheckedChange={(details) => console.log(details.checked)}
      interactive
    >
      Accept Terms and Conditions
    </Checkbox>
  );
}
```

## Indeterminate state

```tsx
import { Checkbox } from "../components/ui";

export default function MyPage() {
  return (
    <Checkbox checked="indeterminate" interactive>
      Parent Checkbox
    </Checkbox>
  );
}
```
