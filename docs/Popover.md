# Popover

# Introduction

An interactive element that displays additional content in a layer over its anchor.

# Props

## Root

| Prop           | Type      | Description                                        |
| :------------- | :-------- | :------------------------------------------------- |
| `children`     | `any`     | Popover sub-components.                            |
| `open`         | `boolean` | Whether the popover is open (controlled).          |
| `interactive`  | `boolean` | Forces hydration as an island. Defaults to `true`. |
| `id`           | `string`  | Unique identifier for the popover.                 |
| `onClose`      | `() => void` | Callback triggered when the popover closes.      |
| `onToggle`     | `() => void` | Callback triggered when the popover toggles.     |

## Trigger

| Prop      | Type      | Description                                              |
| :-------- | :-------- | :------------------------------------------------------- |
| `asChild` | `boolean` | Whether to merge props onto the immediate child element. |

# Hydration

**Tier 1 — auto-interactive by default.** A `Popover` is an overlay that needs client-side JavaScript for positioning, open/close state, focus handling, and outside-click dismissal, so it hydrates as an island by default. Pass `interactive={false}` to render a static, always-open/closed popover shell with no client JS.

| `interactive` prop | Result |
| :--- | :--- |
| omitted | Hydrates as an island (default) |
| `true` | Hydrates as an island |
| `false` | Static — no client JS |

All interactivity decisions in the library route through the shared `shouldHydrate()` helper in `app/components/ui/island-utils.ts`.

# Usage

```tsx
import * as Popover from "../components/ui/popover";
import { Button } from "../components/ui/button";

export default function MyPage() {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button>Open Popover</Button>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content>
          <Popover.Arrow>
            <Popover.ArrowTip />
          </Popover.Arrow>
          <Popover.Header>
            <Popover.Title>Title</Popover.Title>
            <Popover.Description>Description</Popover.Description>
          </Popover.Header>
          <Popover.Body>Popover Body</Popover.Body>
          <Popover.Footer>
            <Popover.CloseTrigger asChild>
              <Button variant="outline">Close</Button>
            </Popover.CloseTrigger>
          </Popover.Footer>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}
```

# Limitations

This Hono/JSX port currently uses static CSS positioning (absolute positioning relative to the trigger). It does not include dynamic collision detection or flip logic provided by libraries like Floating UI.
