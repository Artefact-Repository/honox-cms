# DatePicker

# Introduction

A date picker that combines a text input with a popup calendar. It supports single, multiple, and range selection, month/year panel views, quick-select presets, week numbers, and manual date entry — rendered server-side with HonoX and hydrated as an island only when interactivity is needed.

The component is **headless by design**: `app/components/ui/date-picker-primitive.tsx` produces semantic, accessible markup and state, while `app/islands/date-picker.tsx` adds the client-side behaviour (keyboard navigation, hover preview, outside-click, typing). No new runtime dependencies are introduced — it builds on Hono JSX and Panda CSS, the same stack as the rest of the design system.

# What's new in this revision

- **Keyboard-first calendar grid.** Full arrow-key, <kbd>Home</kbd>/<kbd>End</kbd>, <kbd>PageUp</kbd>/<kbd>PageDown</kbd> (with <kbd>Shift</kbd> for years), <kbd>Enter</kbd>/<kbd>Space</kbd> navigation, with a roving tab stop so the panel never traps focus across 42 cells.
- **Range hover preview.** While picking a range, hovering a day previews the spanned interval in the accent colour — the same affordance users expect from native OS pickers.
- **Free-text typing.** The input is now uncontrolled; you can type a full `YYYY-MM-DD` value and commit on <kbd>Enter</kbd> or blur. Invalid or out-of-range input reverts instead of fighting the caret.
- **Week numbers.** Pass `showWeekNumbers` to render ISO-8601 week numbers in a dedicated column.
- **Clear trigger only when needed.** The clear button appears only when a value is present, reducing visual noise.
- **Accessible grid.** The calendar is exposed as an ARIA `grid` (`role="grid"` / `row` / `gridcell` / `columnheader` / `rowheader`) with `aria-selected` and `aria-current="date"`, and focus moves into the grid when opened from the keyboard.
- **Fixed popup animation.** The open/close animation now references the real `fade-in` / `fade-out` keyframes (previously a no-op due to a name mismatch).

# Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `label` | `string` | Renders a label associated with the first input (default structure only). |
| `placeholder` | `string` | Placeholder for the input. Defaults to `YYYY-MM-DD`. |
| `selectionMode` | `"single" \| "multiple" \| "range"` | How dates are selected. Defaults to `"single"`. Range mode renders start and end inputs. |
| `value` | `CalendarDate[] \| string[] \| string \| Date[]` | Selected date(s) (controlled). Strings use the `YYYY-MM-DD` format. |
| `defaultValue` | `CalendarDate[] \| string[] \| string \| Date[]` | Initial selected date(s) (uncontrolled). |
| `focusedValue` | `CalendarDate \| string \| Date` | The date the calendar panel is focused on (controlled). |
| `defaultFocusedValue` | `CalendarDate \| string \| Date` | Initial panel date (uncontrolled). |
| `min` | `CalendarDate \| string \| Date` | Earliest selectable date. Earlier cells are disabled; typed dates outside the range are rejected. |
| `max` | `CalendarDate \| string \| Date` | Latest selectable date. |
| `isDateUnavailable` | `(date, locale) => boolean` | Marks individual dates as unselectable (static/composed usage). |
| `view` | `"day" \| "month" \| "year"` | The active panel view (controlled). |
| `open` | `boolean` | Whether the popup calendar is open (controlled). |
| `closeOnSelect` | `boolean` | Close the popup after a completed selection. Defaults to `true`. |
| `showWeekNumbers` | `boolean` | Renders an ISO-8601 week-number column. Defaults to `false`. |
| `locale` | `string` | BCP 47 locale used for month/date formatting. Defaults to `en-US`. |
| `disabled` | `boolean` | Disables the whole picker. |
| `readOnly` | `boolean` | Makes the input read-only. |
| `invalid` | `boolean` | Marks the input invalid (`aria-invalid` + error styling). |
| `colorPalette` | `"blue" \| "green" \| "red" \| "orange" \| "gray" \| "cyan" \| "amber" \| "purple"` | Accent color for the selected date, today indicator, and range highlight. Defaults to `"blue"`. |
| `interactive` | `boolean` | Forces (or suppresses) hydration as an island. |
| `onValueChange` | `(details: { value: CalendarDate[] }) => void` | Called when the selection changes. |
| `onOpenChange` | `(details: { open: boolean }) => void` | Called when the popup opens or closes. |

## CalendarDate

Dates are represented by the `CalendarDate` class (`{ year, month, day }`, month is 1-based) to avoid timezone drift. Helpers are exported alongside the component:

| Helper | Description |
| :--- | :--- |
| `parseDate(str)` | Parses a `YYYY-MM-DD` string, clamping out-of-range parts. |
| `isValidDateString(str)` | Strictly validates a `YYYY-MM-DD` string (including month lengths and leap years). |
| `daysInMonth(year, month)` | Number of days in the given month. |
| `fromJSDate(date)` | Converts a JavaScript `Date` to a `CalendarDate`. |
| `getWeekNumber(date)` | ISO-8601 week number for a `CalendarDate` (used by `showWeekNumbers`). |

# Functionality

- **Popup calendar** — opens from the calendar trigger or by focusing/clicking the input; closes on outside click, <kbd>Escape</kbd> (focus returns to the trigger), or after a completed selection when `closeOnSelect` is set.
- **Panel views** — click the month/year heading to zoom out from days → months → years; selecting a year or month drills back down. The prev/next arrows page by month, year, or decade depending on the view.
- **Manual entry** — type a date in the input and press <kbd>Enter</kbd> (or blur). Valid `YYYY-MM-DD` values are committed and normalised; invalid or out-of-range values revert to the last committed value. Clearing the input clears the selection.
- **Range selection** — the first click sets the start, the second sets the end (automatically ordered); the days in between are highlighted, and hovering previews the span before you commit.
- **Multiple selection** — clicking toggles individual days on and off.
- **Week numbers** — with `showWeekNumbers`, an ISO week-number column is shown alongside the day grid.
- **Presets** — `DatePicker.PresetTrigger` supports the values `today`, `last3Days`, `last7Days`, `last14Days`, `last30Days`, and `last90Days`. In range mode a preset selects the whole span; otherwise it selects the single anchor date.

# Keyboard support

When the popup is open and focus is inside the calendar, the following keys are active:

| Key | Day view | Month view | Year view |
| :--- | :--- | :--- | :--- |
| <kbd>←</kbd> / <kbd>→</kbd> | Previous / next day | Previous / next month | Previous / next year |
| <kbd>↑</kbd> / <kbd>↓</kbd> | ±1 week | ±3 months | ±3 years |
| <kbd>Home</kbd> / <kbd>End</kbd> | Start / end of week | — | — |
| <kbd>PageUp</kbd> / <kbd>PageDown</kbd> | Previous / next month | Previous / next year | Previous / next decade |
| <kbd>Shift</kbd>+<kbd>PageUp</kbd> / <kbd>Shift</kbd>+<kbd>PageDown</kbd> | Previous / next year | — | — |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Select focused day | Drill into month | Drill into year |
| <kbd>Esc</kbd> | Close popup, return focus to trigger | | |

The trigger and input are reachable by <kbd>Tab</kbd>; opening from the keyboard moves focus straight into the grid so the calendar is operable without a mouse.

# Accessibility

- The grid uses ARIA grid semantics (`role="grid"`, `row`, `gridcell`, `columnheader`, `rowheader`) with `aria-selected` and `aria-current="date"` on the today cell.
- A **roving tabindex** keeps a single tab stop on the focused date; arrow keys move focus without tabbing through every cell.
- Focus is managed: opening from the keyboard focuses the active day; closing returns focus to the trigger.
- All interactive controls carry `aria-label`s (`Open date picker`, `Clear selected dates`, `Previous`, `Next`, `Switch calendar view`, `Select month`, `Select year`).
- Colour is never the only signal — selected, today, in-range, and disabled states combine fill, weight, and (for today) a dot marker.
- Respects `disabled` / `readOnly` / `invalid` via `aria-disabled`, `readonly`, and `aria-invalid`.

# Styling slots

The Panda CSS slot recipe (`app/theme/recipes/date-picker.ts`) exposes the following `data-part` slots for theming. Override via the `class`/`className` props or a semantic `classNames` map:

`root`, `label`, `control`, `input`, `trigger`, `clearTrigger`, `positioner`, `content`, `view`, `viewControl`, `prevTrigger`, `nextTrigger`, `viewTrigger`, `rangeText`, `table`, `tableHead`, `tableHeader`, `tableRow`, `tableBody`, `tableCell`, `tableCellTrigger`, `weekNumber`, `monthSelect`, `yearSelect`, `presetTrigger`, `valueText`.

The selected / today / in-range / range-preview states are driven by `data-selected`, `data-today`, `data-in-range`, `data-outside-range`, and `data-range-preview` attributes, so they can be re-skinned independently of the recipe.

# Hydration

**Tier 1 — interactive by default.** A `DatePicker` hydrates as an island unless explicitly opted out with `interactive={false}`, in which case it renders as static HTML with no client JS.

| `interactive` prop | Result |
| :--- | :--- |
| omitted | Hydrates as an island |
| `true` | Hydrates as an island |
| `false` | Static — no client JS |

All interactivity decisions in the library route through the shared `shouldHydrate()` helper in `app/components/ui/island-utils.ts`.

# Usage

```tsx
import { DatePicker } from "../components/ui";

export default function MyPage() {
  return (
    <>
      {/* Single date */}
      <DatePicker label="Choose Date" selectionMode="single" />

      {/* Date range with bounds */}
      <DatePicker
        label="Travel Dates"
        selectionMode="range"
        min="2026-01-01"
        max="2026-12-31"
      />

      {/* Week numbers + accent colour */}
      <DatePicker
        label="Pick a day"
        selectionMode="single"
        showWeekNumbers
        colorPalette="purple"
      />

      {/* Preselected value */}
      <DatePicker label="Due Date" defaultValue="2026-07-15" />
    </>
  );
}
```

# Production notes

- **No new dependencies.** Built entirely on Hono JSX + Panda CSS, consistent with the rest of the design system.
- **SSR-safe.** Markup is rendered on the server; only the island branch pulls in client behaviour, and only when signalled.
- **Token-driven.** Colours, spacing, radii, and shadows come from the shared theme tokens, so the picker inherits dark mode and the configured `colorPalette` automatically.
- **Type-safe values.** `CalendarDate` avoids the timezone pitfalls of raw `Date`/`string` handling.
