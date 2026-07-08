# Splitter

# Introduction

A layout component that divides content into resizable panels separated by drag handles.

# Props

## Splitter

| Prop | Type | Description |
| :--- | :--- | :--- |
| `panels` | `PanelConfig[]` | The panels to render (required). |
| `orientation` | `"horizontal" \| "vertical"` | Layout direction of the panels. |
| `interactive` | `boolean` | Enable client-side drag-to-resize. |
| `defaultSize` | `{ id: string \| number; size: number }[]` | Initial sizes (interactive mode). |
| `size` | `{ id: string \| number; size: number }[]` | Controlled sizes (interactive mode). |
| `onSizeChange` | `(sizes: { id: string \| number; size: number }[]) => void` | Callback when sizes change. |
| `resizeTriggerClass` | `string` | Custom CSS classes for the resize handles. |
| `class` | `string` | Custom CSS classes for the root element. |
| `style` | `Record<string, string \| number>` | Inline styles for the root element. |
| `id` | `string` | Custom id for the root element. |

### PanelConfig

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string \| number` | Unique identifier for the panel. |
| `content` | `JSX.Element \| string` | Content rendered inside the panel. |
| `class` | `string` | Custom CSS classes for the panel. |
| `style` | `Record<string, string \| number>` | Inline styles for the panel. |

# Hydration

**Tier 1 — auto-interactive by default.** A `Splitter` has no meaningful static fallback — drag-to-resize requires client-side JavaScript — so it hydrates as an island by default. Pass `interactive={false}` to render a static, non-resizable splitter that ships no client JS.

| `interactive` prop | Result |
| :--- | :--- |
| omitted | Hydrates as an island (default) |
| `true` | Hydrates as an island |
| `false` | Static — no client JS |

All interactivity decisions in the library route through the shared `shouldHydrate()` helper in `app/components/ui/island-utils.ts`.

# Usage

## Basic Splitter

```tsx
import { Splitter } from "../components/ui";

export default function MyPage() {
  return (
    <Splitter
      orientation="horizontal"
      panels={[
        { id: "left", content: <aside>Sidebar</aside> },
        { id: "right", content: <main>Content</main> },
      ]}
    />
  );
}
```
