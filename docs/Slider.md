# Slider

# Introduction

A control that allows the user to select a value (or range of values) from a continuous scale.

# Props

| Prop              | Type                                              | Description                                                  |
| :---------------- | :------------------------------------------------ | :----------------------------------------------------------- |
| `value`           | `number \| number[]`                              | The current value(s) (controlled).                           |
| `defaultValue`    | `number \| number[]`                              | The initial value(s) (uncontrolled).                         |
| `min`             | `number`                                          | The minimum value.                                           |
| `max`             | `number`                                          | The maximum value.                                           |
| `step`            | `number`                                          | The step increment.                                          |
| `onChange`        | `(details: { value: number[] }) => void`          | Callback triggered when the value changes.                   |
| `onDraggingChange`| `(details: { dragging: boolean }) => void`        | Callback triggered when the dragging state changes.          |
| `label`           | `string \| JSX.Element`                           | Label displayed above the slider.                            |
| `showValueText`   | `boolean`                                         | Whether to show the current value text.                      |
| `formatValue`     | `(value: number) => string`                       | Custom formatter for the value text.                         |
| `marks`           | `{ value: number; label: string \| JSX.Element }[]` | Tick marks to display along the track.                     |
| `orientation`     | `"horizontal" \| "vertical"`                      | The orientation of the slider.                               |
| `height`          | `string`                                          | Height (required for vertical orientation).                  |
| `disabled`        | `boolean`                                          | Whether the slider is disabled.                              |
| `readOnly`        | `boolean`                                          | Whether the slider is read-only.                             |
| `interactive`     | `boolean`                                          | Enable client-side interactivity.                            |
| `size`            | `"sm" \| "md" \| "lg"`                             | The size of the slider.                                      |
| `colorPalette`    | `string`                                           | The color theme of the slider.                               |
| `class`           | `string`                                           | Custom CSS classes for the root element.                     |
| `trackClass`      | `string`                                           | Custom CSS classes for the track.                            |
| `rangeClass`      | `string`                                           | Custom CSS classes for the range.                            |
| `thumbClass`      | `string`                                           | Custom CSS classes for the thumb.                            |
| `labelClass`      | `string`                                           | Custom CSS classes for the label.                            |
| `valueTextClass`  | `string`                                           | Custom CSS classes for the value text.                       |
| `markClass`       | `string`                                           | Custom CSS classes for the marks.                            |

# Hydration

**Tier 2 — smart auto-detect.** A `Slider` renders as static HTML and ships no client JS unless a behavioral signal is present. Pass `interactive={true}` to force hydration, or `interactive={false}` to force a static render.

It hydrates as an island when **any** of the following signals is present (or `interactive={true}` is set):

- `onChange`
- `onDraggingChange`
- `value` (controlled)
- `defaultValue` (uncontrolled initial value)

| `interactive` prop | Result |
| :--- | :--- |
| omitted, **no** signal | Static — no client JS |
| omitted, a signal present | Hydrates as an island |
| `true` | Hydrates as an island |
| `false` | Static — no client JS |

All interactivity decisions in the library route through the shared `shouldHydrate()` helper in `app/components/ui/island-utils.ts`.

# Usage

## Basic Slider

```tsx
import { Slider } from "../components/ui";

export default function MyPage() {
  return (
    <Slider
      label="Volume"
      defaultValue={30}
      min={0}
      max={100}
      showValueText
      interactive
    />
  );
}
```

## With Marks

```tsx
import { Slider } from "../components/ui";

export default function MyPage() {
  return (
    <Slider
      defaultValue={50}
      marks={[
        { value: 0, label: "0" },
        { value: 50, label: "50" },
        { value: 100, label: "100" },
      ]}
      interactive
    />
  );
}
```
