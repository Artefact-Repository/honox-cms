---
title: "Heading"
---

# Heading

# Introduction

A polymorphic component for displaying titles and headings with consistent styling.

# Props

| Prop          | Type      | Description                                                      |
| :------------ | :-------- | :--------------------------------------------------------------- |
| `children`    | `any`     | The text or content.                                             |
| `class`       | `string`  | Custom CSS classes.                                              |
| `as`          | `string`  | The HTML element to render (e.g., "h1", "h2"). Defaults to "h2". |
| `size`        | `string`  | The font size variant.                                           |
| `interactive` | `boolean` | Whether to enable client-side hydration.                         |

# Usage

```tsx
import { Heading } from "../components/ui";

export default function MyPage() {
  return (
    <Heading as="h1" size="3xl">
      Page Title
    </Heading>
  );
}
```
