# Card

# Introduction

A flexible container for grouping related content, with optional header, body, footer, image, and avatar slots.

# Props

## Card

| Prop | Type | Description |
| :--- | :--- | :--- |
| `title` | `string \| JSX.Element` | The card title. |
| `description` | `string \| JSX.Element` | The card description. |
| `body` | `string \| JSX.Element` | The main body content. |
| `footer` | `string \| JSX.Element` | Footer content. |
| `avatar` | `JSX.Element` | Element shown in the header (e.g. an avatar). |
| `headerAction` | `JSX.Element` | Element shown at the end of the header (e.g. a menu). |
| `image` | `string \| JSX.Element` | Image source or element. |
| `imagePosition` | `"top" \| "bottom" \| "left" \| "right"` | Where the image is placed. Default: `"top"`. |
| `headerClass` | `string` | Custom CSS classes for the header. |
| `bodyClass` | `string` | Custom CSS classes for the body. |
| `footerClass` | `string` | Custom CSS classes for the footer. |
| `imageClass` | `string` | Custom CSS classes for the image. |
| `variant` | `"elevated" \| "outline" \| "subtle"` | The visual style of the card. |
| `interactive` | `boolean` | Enable client-side hydration. |
| `class` | `string` | Custom CSS classes for the root element. |

# Hydration

**Tier 2 — smart auto-detect.** A `Card` renders as static HTML and ships no client JS unless a behavioral signal is present. Pass `interactive={true}` to force hydration, or `interactive={false}` to force a static render.

It hydrates as an island when **any** of the following signals is present (or `interactive={true}` is set):

- `onClick`
- `onPointerDown`

| `interactive` prop | Result |
| :--- | :--- |
| omitted, **no** signal | Static — no client JS |
| omitted, a signal present | Hydrates as an island |
| `true` | Hydrates as an island |
| `false` | Static — no client JS |

All interactivity decisions in the library route through the shared `shouldHydrate()` helper in `app/components/ui/island-utils.ts`.

# Usage

## Basic Card

```tsx
import { Card, Button } from "../components/ui";

export default function MyPage() {
  return (
    <Card
      variant="elevated"
      title="Project title"
      description="A short description of the project."
      body="Main content of the card goes here."
      footer={<Button>View</Button>}
    />
  );
}
```

## Card with Image

```tsx
import { Card } from "../components/ui";

export default function MyPage() {
  return (
    <Card
      image="/cover.png"
      imagePosition="top"
      title="Card with image"
      body="Content beneath the image."
    />
  );
}
```
