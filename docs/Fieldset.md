# Fieldset

# Introduction

Groups related form controls and provides a legend.

# Props

| Prop          | Type      | Description                                  |
| :------------ | :-------- | :------------------------------------------- |
| `children`    | `any`     | Content to be rendered inside the component. |
| `class`       | `string`  | Custom CSS classes.                          |
| `id`          | `string`  | Unique identifier.                           |
| `disabled`    | `boolean` | Whether the fieldset is disabled.            |
| `invalid`     | `boolean` | Whether the fieldset is in an invalid state. |
| `interactive` | `boolean` | Whether to enable client-side hydration.     |
| `legend`      | `Child`   | The legend text for the fieldset.            |
| `helperText`  | `Child`   | Helper text shown below the legend.          |
| `errorText`   | `Child`   | Error text shown when the fieldset is invalid. |

# Usage

```tsx
import { Fieldset, Field } from "../components/ui";

export default function MyPage() {
  return (
    <Fieldset
      legend="User Profile"
      helperText="Manage your info."
      invalid
      errorText="Something went wrong."
    >
      <Field>...</Field>
    </Fieldset>
  );
}
```

## Composition

For more control, use the sub-components:

```tsx
import {
  Fieldset,
  FieldsetControl,
  FieldsetLegend,
  FieldsetHelperText,
  FieldsetContent,
  Field,
} from "../components/ui";

export default function MyPage() {
  return (
    <Fieldset>
      <FieldsetControl>
        <FieldsetLegend>User Profile</FieldsetLegend>
        <FieldsetHelperText>Manage your info.</FieldsetHelperText>
      </FieldsetControl>
      <FieldsetContent>
        <Field>...</Field>
      </FieldsetContent>
    </Fieldset>
  );
}
```
