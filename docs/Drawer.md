# Drawer

# Introduction

A panel that slides in from the edge of the screen to present content or actions without leaving the current page.

# Props

## Drawer

| Prop | Type | Description |
| :--- | :--- | :--- |
| `trigger` | `JSX.Element` | Element that opens the drawer when activated. |
| `title` | `string \| JSX.Element` | The drawer title. |
| `description` | `string \| JSX.Element` | The drawer description. |
| `body` | `string \| JSX.Element` | The main body content. |
| `footer` | `string \| JSX.Element` | Custom footer content. |
| `cancel` | `JSX.Element` | Element rendered as a close (cancel) trigger. |
| `confirm` | `JSX.Element` | Element rendered as an action trigger. |
| `closable` | `boolean` | Whether to show the close button. Default: `true`. |
| `interactive` | `boolean` | Enable client-side hydration for interactive behavior. |
| `class` | `string` | Custom CSS classes for the root element. |

Additional props (e.g. `open`, `defaultOpen`, `onOpenChange`, `id`) are forwarded to the underlying drawer primitive.

# Hydration

**Tier 1 — auto-interactive by default.** A `Drawer` has no meaningful static fallback — slide-in transitions, open/close state, focus handling, and ESC dismissal all require client-side JavaScript — so it hydrates as an island by default. Pass `interactive={false}` to render a static, inert drawer shell that ships no client JS.

| `interactive` prop | Result |
| :--- | :--- |
| omitted | Hydrates as an island (default) |
| `true` | Hydrates as an island |
| `false` | Static — no client JS |

All interactivity decisions in the library route through the shared `shouldHydrate()` helper in `app/components/ui/island-utils.ts`.

# Usage

## Basic Drawer

```tsx
import { Drawer, Button } from "../components/ui";

export default function MyPage() {
  return (
    <Drawer
      trigger={<Button>Open Drawer</Button>}
      title="Settings"
      description="Adjust your preferences."
      body="Drawer body content goes here."
      cancel={<Button variant="outline">Close</Button>}
      confirm={<Button>Save</Button>}
    />
  );
}
```
