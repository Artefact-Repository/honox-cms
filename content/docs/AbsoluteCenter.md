---
title: "AbsoluteCenter"
---

# AbsoluteCenter

# Introduction

A utility component for centering content within its parent container.

# Props

| Prop       | Type                                   | Description                                  |
| :--------- | :------------------------------------- | :------------------------------------------- |
| `children` | `any`                                  | Content to be rendered inside the component. |
| `class`    | `string`                               | Custom CSS classes.                          |
| `axis`     | `"horizontal" \| "vertical" \| "both"` | The axis to center the content on.           |

# Usage

```tsx
import { AbsoluteCenter } from "../components/ui";

export default function MyPage() {
  return (
    <div
      style={{
        position: "relative",
        height: "200px",
        width: "200px",
        border: "1px solid black",
      }}
    >
      <AbsoluteCenter axis="both">Centered Content</AbsoluteCenter>
    </div>
  );
}
```
