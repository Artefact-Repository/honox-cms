# Grid

The Grid component is a responsive 24-column grid layout built on a flex-based system. It consists of two subcomponents: `Row` and `Col`.

---

## Anatomy

- **Row**: Establishes a flex container context for columns, supporting alignment, justification, wrapping, and gutter spacing.
- **Col**: Placed directly inside a `Row`, representing a grid element with custom span, offset, pull, push, order, and responsive overrides.

---

## Properties

### Row Props

| Property | Type | Default | Description |
|---|---|---|---|
| `align` | `Responsive<"top" \| "middle" \| "bottom" \| "stretch">` | `"top"` | Vertical alignment of columns. |
| `justify` | `Responsive<"start" \| "end" \| "center" \| "space-around" \| "space-between" \| "space-evenly">` | `"start"` | Horizontal arrangement of columns. |
| `gutter` | `Responsive<number \| string> \| [Responsive<number \| string>, Responsive<number \| string>]` | `0` | Spacing between grids. Can be a single spacing token/value or `[horizontal, vertical]` spacing. |
| `wrap` | `boolean` | `true` | Whether columns automatically wrap onto a new line if they exceed 24 total spans. |

### Col Props

| Property | Type | Default | Description |
|---|---|---|---|
| `span` | `Responsive<number \| string>` | `none` | Number of columns to occupy (1-24). `0` sets `display: none`. |
| `offset` | `Responsive<number \| string>` | `0` | Number of cells to offset Col from the left. |
| `order` | `Responsive<number \| string>` | `0` | CSS flex order of the column. |
| `pull` | `Responsive<number \| string>` | `0` | Number of cells that column is moved to the left. |
| `push` | `Responsive<number \| string>` | `0` | Number of cells that column is moved to the right. |
| `flex` | `Responsive<string \| number>` | `none` | Custom flex ratio or flex-basis style (e.g. `"1 1 auto"`, `"200px"`, `1`). |
| `xs` | `ColSize` | `-` | Responsive breakpoint config for screen < 576px. |
| `sm` | `ColSize` | `-` | Responsive breakpoint config for screen ≥ 576px. |
| `md` | `ColSize` | `-` | Responsive breakpoint config for screen ≥ 768px. |
| `lg` | `ColSize` | `-` | Responsive breakpoint config for screen ≥ 1024px. |
| `xl` | `ColSize` | `-` | Responsive breakpoint config for screen ≥ 1280px. |
| `xxl` / `2xl` | `ColSize` | `-` | Responsive breakpoint config for screen ≥ 1536px. |

---

## Examples

### Basic Grid

```tsx
import { Row, Col } from "@/components/ui";

function BasicExample() {
	return (
		<Row>
			<Col span={12}>Col 12/24</Col>
			<Col span={12}>Col 12/24</Col>
		</Row>
	);
}
```

### Gutters and Offsets

```tsx
import { Row, Col } from "@/components/ui";

function GutterExample() {
	return (
		<Row gutter={[16, 24]}>
			<Col span={6}>Col 1</Col>
			<Col span={6} offset={6}>Col 2 (Offset by 6 columns)</Col>
			<Col span={6}>Col 3</Col>
		</Row>
	);
}
```

### Highly Responsive Layout

```tsx
import { Row, Col } from "@/components/ui";

function ResponsiveExample() {
	return (
		<Row>
			<Col xs={24} md={12} lg={8}>
				Responsive Column
			</Col>
			<Col xs={{ span: 24, offset: 0 }} md={{ span: 12, offset: 2 }} lg={{ span: 8, offset: 4 }}>
				Responsive Column with Offset
			</Col>
		</Row>
	);
}
```
