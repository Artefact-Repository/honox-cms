# Menu

# Introduction

A list of actions or options that appears when triggered, supporting items, separators, checkboxes, and radio groups.

# Props

## Menu

| Prop | Type | Description |
| :--- | :--- | :--- |
| `trigger` | `JSX.Element` | Element that opens the menu when activated. |
| `items` | `MenuItem[]` | The menu items to render. |
| `defaultOpen` | `boolean` | Whether the menu is open by default. Default: `false`. |
| `interactive` | `boolean` | Enable client-side hydration. Default: `true`. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | The size of the menu. |
| `class` | `string` | Custom CSS classes for the root element. |
| `contentClass` | `string` | Custom CSS classes for the content element. |
| `positionerClass` | `string` | Custom CSS classes for the positioner element. |

### MenuItem

| Property | Type | Description |
| :--- | :--- | :--- |
| `type` | `"item" \| "separator" \| "checkbox" \| "radio" \| "radio-group" \| "submenu" \| "group"` | The kind of menu entry. |
| `label` | `string` | Display text (for `item`, `checkbox`, `radio`, `submenu`). |
| `value` | `string` | Unique value (for `item`, `checkbox`, `radio`, `radio-group`). |
| `checked` | `boolean` | Checked state (for `checkbox`, `radio`). |
| `icon` | `JSX.Element` | Leading icon (for `item`, `checkbox`, `radio`, `submenu`). |
| `indicator` | `JSX.Element` | Custom indicator element (for `item`). |
| `items` | `MenuItem[]` | Nested items (for `radio-group`, `submenu`). |
| `disabled` | `boolean` | Whether the item is disabled. |
| `class` | `string` | Custom CSS classes for the item. |

> Note: `submenu` entries are not supported by the simplified API and fall back to plain text. Use the primitive sub-components for nested menus.

# Hydration

**Tier 1 — auto-interactive by default.** A `Menu` opens on trigger and needs client-side JavaScript for open/close state, keyboard navigation, and outside-click dismissal, so it hydrates as an island by default. Pass `interactive={false}` to render a static, inert menu with no client JS.

| `interactive` prop | Result |
| :--- | :--- |
| omitted | Hydrates as an island (default) |
| `true` | Hydrates as an island |
| `false` | Static — no client JS |

All interactivity decisions in the library route through the shared `shouldHydrate()` helper in `app/components/ui/island-utils.ts`.

# Usage

## Basic Menu

```tsx
import { Menu, Button } from "../components/ui";

export default function MyPage() {
  return (
    <Menu
      trigger={<Button>Open Menu</Button>}
      items={[
        { type: "item", label: "Edit", value: "edit" },
        { type: "separator" },
        { type: "checkbox", label: "Bold", value: "bold", checked: true },
        {
          type: "radio-group",
          value: "theme",
          label: "Theme",
          items: [
            { type: "radio", label: "Light", value: "light" },
            { type: "radio", label: "Dark", value: "dark" },
          ],
        },
      ]}
    />
  );
}
```
