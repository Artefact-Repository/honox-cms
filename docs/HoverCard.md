# HoverCard

# Introduction

A popover that appears when the user hovers over a trigger, useful for showing supplementary information.

# Props

## HoverCard

| Prop | Type | Description |
| :--- | :--- | :--- |
| `interactive` | `boolean` | Enable client-side hydration. Default: `true`. |
| `open` | `boolean` | Controlled open state. |
| `openDelay` | `number` | Delay in ms before opening on hover. |
| `closeDelay` | `number` | Delay in ms before closing on leave. |
| `class` | `string` | Custom CSS classes for the root element. |

# Hydration

**Tier 1 — auto-interactive by default.** A `HoverCard` is an overlay that needs client-side JavaScript for hover/focus positioning, open/close delays, and accessibility, so it hydrates as an island by default. Pass `interactive={false}` to render a static trigger with no hover card and no client JS.

| `interactive` prop | Result |
| :--- | :--- |
| omitted | Hydrates as an island (default) |
| `true` | Hydrates as an island |
| `false` | Static — no client JS |

All interactivity decisions in the library route through the shared `shouldHydrate()` helper in `app/components/ui/island-utils.ts`.

# Usage

## Basic HoverCard

```tsx
import { HoverCard } from "../components/ui";

export default function MyPage() {
  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        <a href="#">Hover me</a>
      </HoverCard.Trigger>
      <HoverCard.Positioner>
        <HoverCard.Content>
          Supplementary information shown on hover.
        </HoverCard.Content>
      </HoverCard.Positioner>
    </HoverCard.Root>
  );
}
```

# Sub-components

`HoverCard.Root`, `HoverCard.Trigger`, `HoverCard.Positioner`, `HoverCard.Content`, `HoverCard.Arrow`, `HoverCard.ArrowTip`
