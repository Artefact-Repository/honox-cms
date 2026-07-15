# Popover

# Introduction

An interactive element that displays additional content in a layer over its anchor.

# Props

## Root

| Prop                      | Type                                        | Description                                                    |
| :------------------------ | :------------------------------------------ | :--------------------------------------------------------------- |
| `children`                | `any`                                        | Popover sub-components.                                          |
| `open`                    | `boolean`                                    | Whether the popover is open (controlled).                        |
| `defaultOpen`             | `boolean`                                    | Initial open state (uncontrolled). Default `false`.               |
| `onOpenChange`             | `(details: { open: boolean }) => void`       | Called when the popover opens or closes.                         |
| `placement`               | `"top" \| "bottom" \| "left" \| "right"`     | Which side of the trigger the content opens on. Default `"bottom"`. Flips to the opposite side automatically if there isn't enough viewport room. |
| `interactive`             | `boolean`                                    | Forces hydration as an island. Defaults to `true`.                |
| `id`                      | `string`                                     | Unique identifier for the popover.                                |
| `closeOnEscape`           | `boolean`                                    | Close when Escape is pressed. Default `true`.                     |
| `closeOnInteractOutside`  | `boolean`                                    | Close on pointer interaction outside, or when focus tabs away from the popover. Default `true`. |
| `onClose`                 | `() => void`                                 | Callback triggered when the popover closes.                      |
| `onToggle`                | `() => void`                                 | Callback triggered when the popover toggles.                     |

## Trigger

| Prop      | Type      | Description                                              |
| :-------- | :-------- | :------------------------------------------------------- |
| `asChild` | `boolean` | Whether to merge props onto the immediate child element. |

# Usage

```tsx
import { Popover } from "../components/ui/popover";
import { Button } from "../components/ui/button";

<Popover
  placement="right"
  trigger={<Button>Open Popover</Button>}
  title="Title"
  description="Description"
  body="Popover Body"
/>;
```

# Limitations

The interactive island positions and sizes the popover relative to its trigger:
it flips to the opposite side (e.g. `bottom` → `top`) when the requested
placement would overflow the viewport, and clamps the cross axis so the
content never renders off-screen. It does not track scroll containers or
resize observers the way Floating UI does — repositioning only re-runs on
window `resize` while the popover is open, and (since the positioner is
anchored via `position: absolute` to the trigger's own wrapper) scrolling the
page moves it along with the trigger for free.
