---
title: "Badge"
---

# Badge

# Introduction

A small visual element that labels or categorizes content.

# Props

| Prop           | Type                                                       | Description                                  |
| :------------- | :--------------------------------------------------------- | :------------------------------------------- |
| `children`     | `any`                                                      | Content to be rendered inside the component. |
| `class`        | `string`                                                   | Custom CSS classes.                          |
| `colorPalette` | `string`                                                   | The color theme of the badge.                |
| `variant`      | `"solid" \| "subtle" \| "surface" \| "outline"`            | The visual style.                            |
| `size`         | `"sm" \| "md" \| "lg" \| "xl" \| "2xl"`                    | The size of the badge.                       |
| `interactive`  | `boolean`                                                  | Whether to enable client-side hydration.     |

# Usage

```tsx
import { Badge } from "../components/ui";

export default function MyPage() {
  return (
    <Badge colorPalette="blue" variant="solid">
      New
    </Badge>
  );
}
```
