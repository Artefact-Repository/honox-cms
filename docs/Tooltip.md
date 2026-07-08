# Tooltip

# Introduction

A component for displaying contextual information on hover or focus.

# Props

## Tooltip (High-level wrapper)

| Prop           | Type      | Description                                                                           |
| :------------- | :-------- | :------------------------------------------------------------------------------------ |
| `children`     | `any`     | The element that triggers the tooltip.                                                |
| `content`      | `any`     | The content to display within the tooltip.                                            |
| `showArrow`    | `boolean` | Whether to show an arrow pointing to the trigger.                                     |
| `open`         | `boolean` | Whether the tooltip is open (controlled).                                             |
| `disabled`     | `boolean` | Whether the tooltip is disabled.                                                      |
| `interactive`  | `boolean` | Whether the tooltip's content is interactive (remains open when hovered) and enables client-side hydration. |
| `asChild`      | `boolean` | Whether to merge props onto the immediate child element instead of wrapping in a div. |
# Hydration

**Tier 1 — auto-interactive by default.** A `Tooltip` is an overlay that needs client-side JavaScript for hover/focus positioning and accessibility (ESC to dismiss, ARIA wiring), so it hydrates as an island by default. Pass `interactive={false}` to render a static trigger with no tooltip behavior and no client JS.

| `interactive` prop | Result |
| :--- | :--- |
| omitted | Hydrates as an island (default) |
| `true` | Hydrates as an island |
| `false` | Static — no client JS |

All interactivity decisions in the library route through the shared `shouldHydrate()` helper in `app/components/ui/island-utils.ts`.

# Usage

## High-level wrapper

```tsx
import { Tooltip } from "../components/ui/tooltip";

export default function MyPage() {
  return (
    <Tooltip content="This is the tooltip content">
      <button>Hover me</button>
    </Tooltip>
  );
}
```

# Limitations

This Hono/JSX port currently uses static CSS positioning (absolute positioning relative to the trigger). It does not include dynamic collision detection or flip logic provided by libraries like Floating UI.
