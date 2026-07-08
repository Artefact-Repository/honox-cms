# Collapsible

# Introduction

An interactive component that can be expanded or collapsed to show or hide content.

# Props

| Prop                 | Type                          | Description                                                              |
| :------------------- | :---------------------------- | :----------------------------------------------------------------------- |
| `trigger`            | `JSX.Element \| string`       | The trigger element or string. A string is wrapped in a button.          |
| `content`            | `JSX.Element`                 | The content to be shown or hidden.                                       |
| `indicator`          | `JSX.Element`                 | Optional indicator element (e.g. a chevron).                             |
| `indicatorPlacement` | `"start" \| "end"`            | Where to place the indicator relative to the trigger. Default: `"end"`.  |
| `open`               | `boolean`                     | Whether the collapsible is open (controlled).                            |
| `defaultOpen`        | `boolean`                     | Whether the collapsible is open by default (uncontrolled).               |
| `onOpenChange`       | `(open: boolean) => void`     | Callback for when the open state changes.                                |
| `disabled`           | `boolean`                     | Whether the collapsible is disabled.                                     |
| `interactive`        | `boolean`                     | Enable client-side interactivity. Defaults to `true` when interactive props are present. |
| `class`              | `string`                      | Root element class name.                                                 |
| `triggerClass`       | `string`                      | Trigger element class name.                                              |
| `contentClass`       | `string`                      | Content element class name.                                              |
| `indicatorClass`     | `string`                      | Indicator element class name.                                            |
| `id`                 | `string`                      | ID for the collapsible.                                                  |

# Hydration

**Tier 2 — smart auto-detect (hydrates by default).** A `Collapsible` hydrates as an island by default because it has no meaningful static fallback — expanding/collapsing requires client-side JavaScript. Pass `interactive={false}` to force a static, always-open (or always-closed) render with no client JS.

It also hydrates when **any** of the following signals is present (or `interactive={true}` is set):

- `onOpenChange`
- `open` (controlled)
- `defaultOpen` (uncontrolled initial state)

| `interactive` prop | Result |
| :--- | :--- |
| omitted (default) | Hydrates as an island |
| a signal present | Hydrates as an island |
| `true` | Hydrates as an island |
| `false` | Static — no client JS |

All interactivity decisions in the library route through the shared `shouldHydrate()` helper in `app/components/ui/island-utils.ts`.

# Usage

## Basic Collapsible

```tsx
import { Collapsible } from "../components/ui";

export default function MyPage() {
  return (
    <Collapsible
      trigger="Show more"
      content={<p>Additional details go here.</p>}
      defaultOpen
    />
  );
}
```

## With Indicator and Controlled State

```tsx
import { Collapsible } from "../components/ui";

export default function MyPage() {
  return (
    <Collapsible
      trigger="Details"
      content={<p>Content revealed on toggle.</p>}
      indicatorPlacement="start"
      onOpenChange={(open) => console.log("open:", open)}
    />
  );
}
```
