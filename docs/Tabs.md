# Tabs

# Introduction

A highly customizable, production-ready set of layered sections of content shown one at a time, with a selectable tab list. Tabs ships four visual variants (`line`, `subtle`, `enclosed`, `card`), vertical or horizontal orientation supporting all placements (`top`, `bottom`, `left`/`start`, `right`/`end`), dynamic spacing, controlled/uncontrolled state syncing, semantic style mapping, and optional closable/editable tabs for managing an open-ended set of views.

The first enabled tab is selected automatically when no `value`/`defaultValue` (or `activeKey`/`defaultActiveKey`) is given, static server renders draw the active-tab indicator in pure CSS so tabs look correct before (or without) JavaScript, and the tab list is wired per the WAI-ARIA tabs pattern — `aria-orientation`, `aria-labelledby` trigger/panel links, orientation-aware arrow-key navigation, and `Home`/`End` support.

# Props

## Tabs

| Prop | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `items` | `TabsItem[]` | The tabs configured via shorthand array. | `[]` |
| `variant` | `"line" \| "subtle" \| "enclosed" \| "card"` | Visual style. | `"line"` |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "small" \| "medium" \| "large"` | Size presets of the tab elements. | `"md"` |
| `colorPalette` | `"gray" \| "blue" \| "green" \| "red" \| "orange" \| "cyan" \| "amber" \| "purple"` | Accent color theme for selection / indicators. | `"gray"` |
| `type` | `"line" \| "card" \| "editable-card"` | Basic style mapping. `"editable-card"` automatically configures the card style and editable triggers. | `"line"` |
| `tabPlacement` / `tabPosition` | `"top" \| "bottom" \| "left" \| "right" \| "start" \| "end"` | Visual layout placement of the tab headers relative to the content pane. | `"top"` |
| `dir` | `"ltr" \| "rtl"` | Overrides the ambient text direction for arrow-key navigation (an inherited `<html dir="rtl">` is honored automatically otherwise). | - |
| `activeKey` / `value` | `string` | The currently active tab key (Controlled). | - |
| `defaultActiveKey` / `defaultValue` | `string` | The initially active tab key (Uncontrolled). | First enabled tab |
| `onChange` / `onValueChange` | `(key: string) => void` | Callback executed when the active tab is changed. | - |
| `onTabClick` | `(key: string, event: MouseEvent) => void` | Callback executed on every click of an enabled tab — including the already-active one, unlike `onChange`. | - |
| `onTabScroll` | `({ direction }) => void` | Notified when an overflowing tab bar is scrolled; `direction` is `"left" \| "right" \| "top" \| "bottom"`. | - |
| `onEdit` | `(key: any, action: "add" \| "remove") => void` | Callback executed when a tab is added or removed (only works under editable configurations). | - |
| `hideAdd` | `boolean` | Hide the trailing "add tab" trigger of editable tabs. | `false` |
| `tabBarGutter` | `number \| string` | Custom CSS grid/flex spacing between individual tab headers. | - |
| `tabBarStyle` | `any` | Custom inline style for the tab headers bar / container. | - |
| `destroyOnHidden` / `destroyInactiveTabPane` | `boolean` | Whether to completely unmount/destroy inactive content pane trees instead of just hiding them. | `false` |
| `indicator` | `boolean \| { align?: "start" \| "center" \| "end"; size?: number \| (origin: number) => number }` | Whether to render the sliding active-tab indicator, or an object to shrink it (`size`, in px or as a function of the trigger's length) and align the remainder (`align`). | `true` |
| `animated` | `boolean \| { inkBar?: boolean; tabPane?: boolean }` | Transition control. The default animates the indicator (ink bar) only; `true` also fades panes in on selection, and the object form opts in per concern. | `{ inkBar: true, tabPane: false }` |
| `classNames` | `Record<string, string>` | Custom CSS classes mapped to semantic sub-parts (`root`, `list`/`header`/`tabBar`, `trigger`/`item`, `close`/`remove`, `indicator`, `content`/`body`, `add`). | - |
| `styles` | `Record<string, any>` | Custom inline styles mapped to semantic sub-parts. | - |
| `addIcon` | `JSX.Element` | Custom SVG or icon element for the new tab trigger. | - |
| `removeIcon` | `JSX.Element` | Custom SVG or icon element for close/delete buttons. | - |
| `extra` / `tabBarExtraContent` | `JSX.Element \| { start?, end?, left?, right? }` | Custom content or action nodes rendered alongside the tab list headers. | - |
| `interactive` | `boolean` | Force or prevent client-side island hydration; omitted to auto-detect. | - |

### TabsItem

| Property | Type | Description |
| :--- | :--- | :--- |
| `value` / `key` | `string` | Unique key identifier for the tab pane. |
| `label` | `string \| JSX.Element` | The visible text or elements inside the tab header. |
| `content` / `children` | `string \| JSX.Element` | The content rendered inside the panel pane when active. |
| `disabled` | `boolean` | Whether the individual tab is disabled. |
| `icon` | `JSX.Element` | Optional icon rendered before the label. |
| `closable` | `boolean` | Whether to show a close button. |
| `closeIcon` | `JSX.Element \| boolean \| null` | Per-tab custom close icon override; setting to `null` or `false` hides it. |
| `destroyOnHidden` | `boolean` | Per-tab destroy behavior when inactive. |

---

# Usage

## Basic Tabs

```tsx
import { Tabs } from "../components/ui";

export default function MyPage() {
  return (
    <Tabs
      items={[
        { value: "tab1", label: "Tab 1", content: "Content for tab 1" },
        { value: "tab2", label: "Tab 2", content: "Content for tab 2" },
      ]}
    />
  );
}
```

## Card Variant, Icons, and Color

```tsx
import { Tabs } from "../components/ui";

export default function MyPage() {
  return (
    <Tabs
      variant="card"
      colorPalette="blue"
      defaultValue="overview"
      items={[
        { value: "overview", label: "Overview", icon: <OverviewIcon />, content: <Overview /> },
        { value: "activity", label: "Activity", icon: <ActivityIcon />, content: <Activity /> },
      ]}
    />
  );
}
```

## Editable Tabs (Add & Close)

Closing or adding a tab mutates the tab set itself, so it's only available through the
`items` prop — see **Hydration** below for why the composable JSX form can't support it.

```tsx
import { Tabs } from "../components/ui";

export default function MyPage() {
  let nextId = 3;

  return (
    <Tabs
      editable
      defaultValue="tab1"
      items={[
        { value: "tab1", label: "Tab 1", content: "First view" },
        { value: "tab2", label: "Tab 2", content: "Second view" },
      ]}
      onTabAdd={() => ({
        value: `tab${nextId}`,
        label: `Tab ${nextId++}`,
        content: "A freshly added view",
      })}
      onTabClose={(value) => console.log("closed:", value)}
    />
  );
}
```

## Customising the Indicator

`indicator` accepts an object to shrink the sliding ink bar and align it inside
the active trigger — handy for the "short underline" look:

```tsx
import { Tabs } from "../components/ui";

export default function MyPage() {
  return (
    <Tabs
      colorPalette="blue"
      indicator={{ size: (origin) => origin - 24, align: "center" }}
      items={[
        { value: "home", label: "Home", content: "Home pane" },
        { value: "settings", label: "Settings", content: "Settings pane" },
      ]}
    />
  );
}
```

`animated` controls the transitions: the indicator slides by default, and
`animated` / `animated={{ tabPane: true }}` additionally fades panes in when
they become active.

## Extra Content and Centering

```tsx
import { Button, Tabs } from "../components/ui";

export default function MyPage() {
  return (
    <Tabs
      centered
      items={[
        { value: "daily", label: "Daily", content: "Daily report" },
        { value: "weekly", label: "Weekly", content: "Weekly report" },
      ]}
      extra={<Button size="sm" variant="outline">Export</Button>}
    />
  );
}
```
# Hydration

Tabs is classified as **Tier-2 (smart auto-detect)** — see `docs/ARCHITECTURE.md` for the
full model.

- It hydrates as a client island when any of `value`/`activeKey`, `defaultValue`/
  `defaultActiveKey`, `onValueChange`/`onChange`, `onTabClick`, `onTabScroll`, `onEdit`,
  `closable`, `editable`, `onTabClose`, or `onTabAdd` is supplied — selecting a tab, closing
  one, or adding one all need JS. With none of these present, Tabs renders static markup and
  ships no client JS. The auto-derived "first enabled tab" default does **not** count as a
  signal, so a plain `<Tabs items={...} />` stays static.
- **Static rendering stays presentable:** the sliding indicator is positioned by JS, so
  non-hydrated tabs instead draw the selected state in pure CSS (an ink bar for `line`, a
  filled pill for `subtle`/`enclosed`; `card` already styles the selected trigger). The
  fallback is scoped to roots without `data-hydrated`, so it never doubles up with the real
  indicator.
- **Keyboard support (hydrated):** orientation-aware arrow keys move and (in automatic
  activation mode) select tabs, `Home`/`End` jump to the extremes, and `Enter`/`Space`
  activate the focused tab — including closable tabs, which render as `div[role="tab"]`
  wrappers so their close button stays a real `<button>`. In a horizontal, right-to-left
  layout (an explicit `dir="rtl"`, or an inherited `<html dir="rtl">`), Left/Right are
  swapped to match the visually mirrored layout.
- **Focus follows editable mutations:** closing the active tab moves focus to the
  neighbor that takes over as active — but only if focus was actually inside the tab
  being closed, so a programmatic close elsewhere on the page never steals focus.
  Adding a tab focuses the newly active trigger, mirroring the "open a new tab"
  convention of browsers and editors.
- **The sliding indicator tracks layout changes, not just selection:** a `ResizeObserver`
  on every trigger repositions it whenever a trigger's own size changes — a viewport
  resize wrapping a label, a webfont swap, an editable tab being added or removed —
  not only when the active tab itself changes.
- Pass `interactive={true}` / `interactive={false}` to force or forbid hydration outright;
  this is implemented via the shared `shouldHydrate(interactive, hasSignal)` predicate in
  `app/components/ui/island-utils.ts`.
- **`items` vs. composable children:** when hydrated, the island keeps its own reactive copy
  of `items` (seeded from the prop) so `editable`/`closable` can mutate the tab set on the
  fly. The composable `TabsList`/`TabsTrigger`/`TabsContent` form is a pre-built, static
  subtree instead — hono/jsx never re-invokes those components on a state change, so
  selecting a tab is applied by syncing DOM attributes directly rather than through a
  re-render. That sync works for switching tabs, but there's no set of tabs to mutate, so
  `editable`/`closable` only take effect through the `items` prop.
