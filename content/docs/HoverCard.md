---
title: "HoverCard"
---

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
