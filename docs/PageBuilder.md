# Sveltia CMS Page Builder

## Introduction

The HonoX + Sveltia CMS dynamic Page Builder allows non-technical editors to create complex, recursively nested pages entirely through the CMS user interface (`/admin/`).

Page layouts are saved as JSON files in `content/pages/*.json` and are compiled on demand or statically pre-generated (via Hono SSG) at `/pages/[slug]`.

---

## Supported Components

The Page Builder supports a rich palette of over 25+ layout, typography, decorative, and interactive components.

### 1. Structure & Layout
* **Stack**: Groups children vertically or horizontally with controllable alignment, justification, and gap spacing.
* **Group**: Aligns elements like buttons closely together (supports `attached` and `grow` properties).
* **Fieldset**: Organizes related form components under a styled container with `legend`, `helperText`, and `errorText`.

### 2. Typography & Content
* **Heading**: Styled headers of levels `h1` through `h6` and various responsive text sizes.
* **Text**: Paragraph-level text with adjustable sizes.

### 3. Display & Presentational
* **Alert**: Renders warning/success/error/info alerts with standard statuses and icons.
* **Badge**: Colored metadata labels with custom color palettes and styles.
* **Card**: A rich container supporting nested blocks, headers, footers, and top/bottom/left/right image positions.
* **Progress**: Renders linear or circular progress indicators.
* **Skeleton**: Highly customisable placeholder skeletons (supports circle and multi-line text shapes).

### 4. Interactive & Overlays
* **Button**: Primary clickable targets supporting custom palettes, sizes, and styling variants.
* **Checkbox**: Tick boxes for Boolean input with accessible aria bindings.
* **Combobox**: Dropdowns with clear actions and items lists.
* **Collapsible**: Disclosure containers that show/hide nested component trees.
* **Popover**: Floating descriptive content anchored to standard text triggers.
* **Dialog**: Fully focus-trapped modal boxes with custom Confirm/Cancel buttons and custom children list.
* **Drawer**: Responsive side panels sliding in from the page edge with custom children list.
* **Menu**: Action menus with custom checkable, selectable, and separator options.

### 5. Advanced & Data
* **RadioGroup**: Custom radio lists with accessible single-select logic.
* **SegmentGroup**: Sliding segmented controls for tabbed selection.
* **Slider**: Range slider components.
* **Switch**: Toggle switches.
* **PaginatedTable**: Interactive dynamic table components with paging support.
* **Pagination**: Interactive page controllers.

---

## Architecture

### 1. CMS Schema Definitions (`public/admin/config.yml`)

We utilise advanced **YAML Anchors and Aliases** (`&` and `*`) to solve the challenge of infinite recursion in YAML specifications.

* **Base Anchors** (`button_fields`, `checkbox_fields`, etc.) are declared once.
* **Level 1 Components** define flat elements and a `Stack`/`Collapsible` container that supports **Level 2 Components** (`*l2_components`).
* **Level 2 Components** recursively allow another layer of nested containers (`*l3_components`).
* This enables editors to nest layouts up to **4 levels deep** without exceeding YAML parser/CMS limits.

### 2. Layout Renderer (`app/components/page-renderer.tsx`)

The layout engine imports all public component modules from `app/components/ui/` and maps them in a high-performance, fully type-safe JSX compiler.

* Input types are strongly cast into standard `unknown` record dictionaries to prevent type coercion and keep Biome lint checks fully clean.
* Nested containers are handled recursively using nested calls to the `<PageRenderer content={...} />` component.

---

## Example JSON Structure

Here is a sample layout file representing a complex dashboard page (`content/pages/dashboard.json`):

```json
{
  "title": "Interactive Dashboard",
  "content": [
    {
      "type": "heading",
      "text": "Dashboard Analytics",
      "as": "h1",
      "size": "3xl"
    },
    {
      "type": "stack",
      "direction": "vertical",
      "gap": "6",
      "children": [
        {
          "type": "card",
          "title": "Welcome User!",
          "description": "Here is your system status.",
          "variant": "outline",
          "children": [
            {
              "type": "alert",
              "status": "success",
              "title": "All Systems Operational",
              "variant": "surface"
            }
          ]
        },
        {
          "type": "fieldset",
          "legend": "User Preferences",
          "children": [
            {
              "type": "switch",
              "defaultChecked": true,
              "text": "Enable Push Notifications"
            },
            {
              "type": "checkbox",
              "text": "Subscribe to Newsletter"
            }
          ]
        }
      ]
    }
  ]
}
```
