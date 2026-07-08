# Button

# Introduction

A clickable component for triggering actions and user interactions. Includes variants for icons and grouped buttons.

# Props

## Button

| Prop           | Type                                                       | Description                                        |
| :------------- | :--------------------------------------------------------- | :------------------------------------------------- |
| `children`     | `any`                                                      | Content to be rendered inside the component.       |
| `class`        | `string`                                                   | Custom CSS classes.                                |
| `variant`      | `"solid" \| "surface" \| "subtle" \| "outline" \| "plain"` | The visual style of the button.                    |
| `size`         | `"2xs" \| "xs" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl"`   | The size of the button.                            |
| `loading`      | `boolean`                                                  | If `true`, the button will show a loading spinner. |
| `loadingText`  | `string`                                                   | The text to show while loading.                    |
| `type`         | `"button" \| "submit" \| "reset"`                          | The HTML button type.                              |
| `colorPalette` | `string`                                                   | The color theme of the button.                     |
| `interactive`  | `boolean`                                                  | Whether to enable client-side hydration.           |

## ButtonGroup

| Prop       | Type      | Description                             |
| :--------- | :-------- | :-------------------------------------- |
| `children` | `any`     | Buttons to be grouped.                  |
| `attached` | `boolean` | Whether to attach the buttons together. |

# Hydration

**Tier 2 — smart auto-detect.** `Button`, `IconButton`, and `CloseButton` render as static HTML and ship no client JS unless a behavioral signal is present. Pass `interactive={true}` to force hydration, or `interactive={false}` to force a static render.

It hydrates as an island when **any** of the following signals is present (or `interactive={true}` is set):

- `onClick`
- `onPointerDown`
- `onSubmit`

| `interactive` prop | Result |
| :--- | :--- |
| omitted, **no** signal | Static — no client JS |
| omitted, a signal present | Hydrates as an island |
| `true` | Hydrates as an island |
| `false` | Static — no client JS |

All interactivity decisions in the library route through the shared `shouldHydrate()` helper in `app/components/ui/island-utils.ts`.

# Usage

## Basic Button

```tsx
import { Button } from "../components/ui";

export default function MyPage() {
  return (
    <Button variant="solid" colorPalette="blue">
      Click me
    </Button>
  );
}
```

## Loading state

```tsx
import { Button } from "../components/ui";

export default function MyPage() {
  return (
    <Button loading loadingText="Saving...">
      Save
    </Button>
  );
}
```

## IconButton

A button optimized for icons.

```tsx
import { IconButton } from "../components/ui";
import { SearchIcon } from "./icons";

export default function MyPage() {
  return (
    <IconButton aria-label="Search">
      <SearchIcon />
    </IconButton>
  );
}
```

## CloseButton

A pre-styled button for closing elements.

```tsx
import { CloseButton } from "../components/ui";

export default function MyPage() {
  return <CloseButton onClick={() => console.log("closed")} interactive />;
}
```

## ButtonGroup

```tsx
import { Button, ButtonGroup } from "../components/ui";

export default function MyPage() {
  return (
    <ButtonGroup attached>
      <Button>First</Button>
      <Button>Second</Button>
    </ButtonGroup>
  );
}
```
