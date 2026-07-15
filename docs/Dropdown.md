# Dropdown

# Introduction

A list of actions or options that appears when triggered. Highly refined, production-ready, and lightweight component supporting custom placements, automatic screen overflow collision adjustment, arrow tips, and customizable trigger modes (hover, click, context menu).

# Props

## Dropdown

| Prop | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `trigger` | `JSX.Element` | Element that opens the menu when activated. | - |
| `items` | `DropdownItem[]` | The menu items to render. | - |
| `defaultOpen` | `boolean` | Whether the menu is open by default. | `false` |
| `interactive` | `boolean` | Enable client-side hydration. | `true` |
| `arrow` | `boolean` | Show a pointer arrow pointing from the popover content to the trigger. | `false` |
| `placement` | `string` | Dropdown placement: `"bottom"` \| `"bottom-start"` \| `"bottom-end"` \| `"top"` \| `"top-start"` \| `"top-end"` \| `"left"` \| `"left-start"` \| `"left-end"` \| `"right"` \| `"right-start"` \| `"right-end"`. Supports standard camelCase aliases like `"bottomLeft"`. | `"bottom-start"` |
| `triggerMode` | `("click" \| "hover" \| "contextDropdown")[] \| string` | Trigger interaction modes to open/close the menu. | `["click"]` |
| `mouseEnterDelay` | `number` | The delay in ms before opening when `triggerMode` includes `"hover"`. | `150` |
| `mouseLeaveDelay` | `number` | The delay in ms before closing when `triggerMode` includes `"hover"`. | `100` |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | The size of the menu. | `"md"` |
| `class` | `string` | Custom CSS classes for the root element. | - |
| `contentClass` | `string` | Custom CSS classes for the content element. | - |
| `positionerClass` | `string` | Custom CSS classes for the positioner element. | - |

### DropdownItem

| Property | Type | Description |
| :--- | :--- | :--- |
| `type` | `"item" \| "separator" \| "checkbox" \| "radio" \| "radio-group" \| "submenu" \| "group"` | The kind of menu entry. |
| `label` | `string` | Display text (for `item`, `checkbox`, `radio`, `submenu`). |
| `value` | `string` | Unique value (for `item`, `checkbox`, `radio`, `radio-group`). |
| `checked` | `boolean` | Checked state (for `checkbox`, `radio`). |
| `icon` | `JSX.Element` | Leading icon (for `item`, `checkbox`, `radio`, `submenu`). |
| `indicator` | `JSX.Element` | Custom indicator element (for `item`). |
| `items` | `DropdownItem[]` | Nested items (for `radio-group`, `submenu`). |
| `disabled` | `boolean` | Whether the item is disabled. |
| `class` | `string` | Custom CSS classes for the item. |

# Usage

## Basic Dropdown

```tsx
import { Dropdown, Button } from "../components/ui";

export default function MyPage() {
  return (
    <Dropdown
      trigger={<Button>Open Dropdown</Button>}
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

## Refined Custom Placements, Arrows, and Hover Trigger

```tsx
import { Dropdown, Button } from "../components/ui";

export default function PlacementPage() {
  return (
    <Dropdown
      trigger={<Button>Hover Me</Button>}
      placement="bottomRight"
      triggerMode="hover"
      arrow={true}
      mouseEnterDelay={100}
      mouseLeaveDelay={150}
      items={[
        { type: "item", label: "Profile", value: "profile" },
        { type: "item", label: "Settings", value: "settings" },
        { type: "separator" },
        { type: "item", label: "Logout", value: "logout" },
      ]}
    />
  );
}
```
