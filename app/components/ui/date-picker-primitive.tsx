import type { Child, PropsWithChildren } from "hono/jsx";
import {
	createContext,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
} from "hono/jsx";
import { cx } from "styled-system/css";
import type { DatePickerVariantProps } from "styled-system/recipes";
import { datePicker } from "styled-system/recipes";

type DatePickerStyles = ReturnType<typeof datePicker>;

interface DatePickerContextValue {
	styles: DatePickerStyles;
	open: boolean;
	value: string[];
	focusedDate: Date;
	view: "day" | "month" | "year";
	rootId: string;
	closeOnSelect?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	min?: string;
	max?: string;
}

const DatePickerContext = createContext<DatePickerContextValue | null>(null);

const useDatePickerContext = () => useContext(DatePickerContext);

const ViewContext = createContext<"day" | "month" | "year" | null>(null);

const useViewContext = () => useContext(ViewContext);

const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getTodayString() {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number) {
	return new Date(year, month + 1, 0).getDate();
}

function getMonthWeeks(year: number, month: number) {
	const firstDayIndex = new Date(year, month, 1).getDay();
	const daysInMonth = getDaysInMonth(year, month);
	const daysInPrevMonth = getDaysInMonth(year, month - 1);

	const cells = [];
	// Prev month padding
	for (let i = firstDayIndex - 1; i >= 0; i--) {
		const prevMonth = month === 0 ? 11 : month - 1;
		const prevYear = month === 0 ? year - 1 : year;
		cells.push({
			dateString: `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(daysInPrevMonth - i).padStart(2, "0")}`,
			day: daysInPrevMonth - i,
			isCurrentMonth: false,
		});
	}
	// Current month days
	for (let i = 1; i <= daysInMonth; i++) {
		cells.push({
			dateString: `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
			day: i,
			isCurrentMonth: true,
		});
	}
	// Next month padding
	const nextMonthPadding = 42 - cells.length;
	for (let i = 1; i <= nextMonthPadding; i++) {
		const nextMonth = month === 11 ? 0 : month + 1;
		const nextYear = month === 11 ? year + 1 : year;
		cells.push({
			dateString: `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
			day: i,
			isCurrentMonth: false,
		});
	}

	const weeks = [];
	for (let i = 0; i < 42; i += 7) {
		weeks.push(cells.slice(i, i + 7));
	}
	return weeks;
}

interface RootProps extends DatePickerVariantProps, PropsWithChildren {
	open?: boolean;
	value?: string[];
	defaultValue?: string[];
	focusedDate?: Date;
	view?: "day" | "month" | "year";
	defaultView?: "day" | "month" | "year";
	rootId?: string;
	closeOnSelect?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	min?: string;
	max?: string;
	class?: string;
	style?: any;
	[key: string]: any;
}

function Root(props: RootProps) {
	const [variantProps, localProps] = datePicker.splitVariantProps(props);
	const {
		children,
		open = false,
		value = [],
		focusedDate = new Date(),
		view = "day",
		rootId,
		closeOnSelect = true,
		disabled,
		readOnly,
		min,
		max,
		class: classProp,
		style,
		...rest
	} = localProps;

	const styles = datePicker(variantProps);
	const resolvedRootId = rootId || "date-picker";

	return (
		<DatePickerContext.Provider
			value={{
				styles,
				open,
				value,
				focusedDate,
				view,
				rootId: resolvedRootId,
				closeOnSelect,
				disabled,
				readOnly,
				min,
				max,
			}}
		>
			<div
				id={resolvedRootId}
				data-scope="date-picker"
				data-part="root"
				data-state={open ? "open" : "closed"}
				class={cx(styles.root, classProp)}
				style={{ position: "relative", ...style }}
				{...rest}
			>
				{children}
			</div>
		</DatePickerContext.Provider>
	);
}

function Label(props: PropsWithChildren<{ class?: string; htmlFor?: string }>) {
	const { children, class: classProp, htmlFor, ...rest } = props;
	const context = useDatePickerContext();
	return (
		<label
			htmlFor={
				htmlFor || (context?.rootId ? `${context.rootId}-input` : undefined)
			}
			data-scope="date-picker"
			data-part="label"
			data-state={context?.open ? "open" : "closed"}
			data-disabled={context?.disabled ? "" : undefined}
			data-readonly={context?.readOnly ? "" : undefined}
			class={cx(context?.styles.label, classProp)}
			{...rest}
		>
			{children || "Select Date"}
		</label>
	);
}

function Control(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	return (
		<div
			data-scope="date-picker"
			data-part="control"
			data-disabled={context?.disabled ? "" : undefined}
			class={cx(context?.styles.control, classProp)}
			{...rest}
		>
			{children}
		</div>
	);
}

function Input(props: { class?: string; placeholder?: string; name?: string }) {
	const { class: classProp, placeholder = "YYYY-MM-DD", name, ...rest } = props;
	const context = useDatePickerContext();
	const valueStr = context?.value ? context.value.join(", ") : "";

	return (
		<input
			id={context?.rootId ? `${context.rootId}-input` : undefined}
			type="text"
			name={name}
			placeholder={placeholder}
			value={valueStr}
			readOnly={context?.readOnly || true}
			disabled={context?.disabled}
			data-scope="date-picker"
			data-part="input"
			data-state={context?.open ? "open" : "closed"}
			class={cx(context?.styles.input, classProp)}
			{...rest}
		/>
	);
}

function Trigger(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	return (
		<button
			type="button"
			data-scope="date-picker"
			data-part="trigger"
			data-state={context?.open ? "open" : "closed"}
			disabled={context?.disabled}
			class={cx(context?.styles.trigger, classProp)}
			{...rest}
		>
			{children || "📅"}
		</button>
	);
}

function ClearTrigger(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	return (
		<button
			type="button"
			data-scope="date-picker"
			data-part="clear-trigger"
			disabled={context?.disabled}
			class={cx(context?.styles.clearTrigger, classProp)}
			{...rest}
		>
			{children || "Clear"}
		</button>
	);
}

function Positioner(props: PropsWithChildren<{ class?: string; style?: any }>) {
	const { children, class: classProp, style, ...rest } = props;
	const context = useDatePickerContext();
	return (
		<div
			data-scope="date-picker"
			data-part="positioner"
			data-state={context?.open ? "open" : "closed"}
			class={cx(context?.styles.positioner, classProp)}
			style={{
				position: "absolute",
				top: "100%",
				left: "0",
				zIndex: 1000,
				display: context?.open ? "block" : "none",
				...style,
			}}
			{...rest}
		>
			{children}
		</div>
	);
}

function Content(props: PropsWithChildren<{ class?: string; style?: any }>) {
	const { children, class: classProp, style, ...rest } = props;
	const context = useDatePickerContext();
	return (
		<div
			data-scope="date-picker"
			data-part="content"
			data-state={context?.open ? "open" : "closed"}
			class={cx(context?.styles.content, classProp)}
			style={{
				display: context?.open ? "flex" : "none",
				flexDirection: "column",
				...style,
			}}
			{...rest}
		>
			{children}
		</div>
	);
}

function View(
	props: PropsWithChildren<{ view: "day" | "month" | "year"; class?: string }>,
) {
	const { children, view: viewProp, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	const isHidden = context?.view !== viewProp;

	return (
		<ViewContext.Provider value={viewProp}>
			<div
				data-scope="date-picker"
				data-part="view"
				data-view={viewProp}
				class={cx(context?.styles.view, classProp)}
				style={{ display: isHidden ? "none" : "flex", flexDirection: "column" }}
				{...rest}
			>
				{children}
			</div>
		</ViewContext.Provider>
	);
}

function ViewControl(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	const viewContext = useViewContext();
	return (
		<div
			data-scope="date-picker"
			data-part="view-control"
			data-view={viewContext || context?.view}
			class={cx(context?.styles.viewControl, classProp)}
			{...rest}
		>
			{children}
		</div>
	);
}

function PrevTrigger(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	return (
		<button
			type="button"
			data-scope="date-picker"
			data-part="prev-trigger"
			class={cx(context?.styles.prevTrigger, classProp)}
			{...rest}
		>
			{children || "‹"}
		</button>
	);
}

// NextTrigger definition and styles mapping
function NextTrigger(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	return (
		<button
			type="button"
			data-scope="date-picker"
			data-part="next-trigger"
			class={cx(context?.styles.nextTrigger, classProp)}
			{...rest}
		>
			{children || "›"}
		</button>
	);
}

function ViewTrigger(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	const viewContext = useViewContext();
	return (
		<button
			type="button"
			data-scope="date-picker"
			data-part="view-trigger"
			data-view={viewContext || context?.view}
			class={cx(context?.styles.viewTrigger, classProp)}
			{...rest}
		>
			{children || <RangeText />}
		</button>
	);
}

function RangeText(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	const viewContext = useViewContext();
	const activeView = viewContext || context?.view || "day";

	let text = children;
	if (!text && context) {
		const year = context.focusedDate.getFullYear();
		if (activeView === "day") {
			const month = MONTH_NAMES[context.focusedDate.getMonth()];
			text = `${month} ${year}`;
		} else if (activeView === "month") {
			text = `${year}`;
		} else if (activeView === "year") {
			const startYear = Math.floor(year / 10) * 10;
			text = `${startYear} - ${startYear + 9}`;
		}
	}

	return (
		<span
			data-scope="date-picker"
			data-part="range-text"
			class={cx(context?.styles.rangeText, classProp)}
			{...rest}
		>
			{text}
		</span>
	);
}

function Table(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	const viewContext = useViewContext();
	const activeView = viewContext || context?.view || "day";

	if (children) {
		return (
			<table
				data-scope="date-picker"
				data-part="table"
				data-view={activeView}
				class={cx(context?.styles.table, classProp)}
				{...rest}
			>
				{children}
			</table>
		);
	}

	if (activeView === "day") {
		const weeks = getMonthWeeks(
			context!.focusedDate.getFullYear(),
			context!.focusedDate.getMonth(),
		);
		return (
			<table
				data-scope="date-picker"
				data-part="table"
				data-view="day"
				class={cx(context!.styles.table, classProp)}
				{...rest}
			>
				<TableHead>
					<TableRow>
						{WEEK_DAYS.map((day) => (
							<TableHeader key={day}>{day}</TableHeader>
						))}
					</TableRow>
				</TableHead>
				<TableBody>
					{weeks.map((week, wIdx) => (
						<TableRow key={`w-${wIdx}`}>
							{week.map((cell) => {
								const isSelected = context!.value.includes(cell.dateString);
								const isToday = cell.dateString === getTodayString();
								return (
									<TableCell key={cell.dateString}>
										<TableCellTrigger
											value={cell.dateString}
											data-selected={isSelected ? "" : undefined}
											data-today={isToday ? "" : undefined}
											data-outside-range={!cell.isCurrentMonth ? "" : undefined}
											style={{
												opacity: cell.isCurrentMonth ? 1 : 0.4,
											}}
										>
											{cell.day}
										</TableCellTrigger>
									</TableCell>
								);
							})}
						</TableRow>
					))}
				</TableBody>
			</table>
		);
	}

	if (activeView === "month") {
		const months = [
			["Jan", "Feb", "Mar", "Apr"],
			["May", "Jun", "Jul", "Aug"],
			["Sep", "Oct", "Nov", "Dec"],
		];
		return (
			<table
				data-scope="date-picker"
				data-part="table"
				data-view="month"
				class={cx(context!.styles.table, classProp)}
				{...rest}
			>
				<TableBody>
					{months.map((row, rIdx) => (
						<TableRow key={`m-row-${rIdx}`}>
							{row.map((monthName, mIdx) => {
								const monthValue = rIdx * 4 + mIdx;
								const isSelected =
									context!.focusedDate.getMonth() === monthValue;
								return (
									<TableCell key={monthName}>
										<TableCellTrigger
											value={String(monthValue)}
											data-selected={isSelected ? "" : undefined}
										>
											{monthName}
										</TableCellTrigger>
									</TableCell>
								);
							})}
						</TableRow>
					))}
				</TableBody>
			</table>
		);
	}

	if (activeView === "year") {
		const currentYear = context!.focusedDate.getFullYear();
		const startYear = Math.floor(currentYear / 10) * 10;
		const years = [];
		for (let i = 0; i < 3; i++) {
			const row = [];
			for (let j = 0; j < 4; j++) {
				row.push(startYear + i * 4 + j);
			}
			years.push(row);
		}
		return (
			<table
				data-scope="date-picker"
				data-part="table"
				data-view="year"
				class={cx(context!.styles.table, classProp)}
				{...rest}
			>
				<TableBody>
					{years.map((row, rIdx) => (
						<TableRow key={`y-row-${rIdx}`}>
							{row.map((yearValue) => {
								const isSelected = currentYear === yearValue;
								return (
									<TableCell key={yearValue}>
										<TableCellTrigger
											value={String(yearValue)}
											data-selected={isSelected ? "" : undefined}
										>
											{yearValue}
										</TableCellTrigger>
									</TableCell>
								);
							})}
						</TableRow>
					))}
				</TableBody>
			</table>
		);
	}

	return null;
}

function TableHead(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	return (
		<thead
			data-scope="date-picker"
			data-part="table-head"
			class={cx(context?.styles.tableHead, classProp)}
			{...rest}
		>
			{children}
		</thead>
	);
}

function TableRow(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	return (
		<tr
			data-scope="date-picker"
			data-part="table-row"
			class={cx(context?.styles.tableRow, classProp)}
			{...rest}
		>
			{children}
		</tr>
	);
}

function TableHeader(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	return (
		<th
			data-scope="date-picker"
			data-part="table-header"
			class={cx(context?.styles.tableHeader, classProp)}
			{...rest}
		>
			{children}
		</th>
	);
}

function TableBody(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	return (
		<tbody
			data-scope="date-picker"
			data-part="table-body"
			class={cx(context?.styles.tableBody, classProp)}
			{...rest}
		>
			{children}
		</tbody>
	);
}

function TableCell(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	return (
		<td
			data-scope="date-picker"
			data-part="table-cell"
			class={cx(context?.styles.tableCell, classProp)}
			{...rest}
		>
			{children}
		</td>
	);
}

function TableCellTrigger(
	props: PropsWithChildren<{ value: string; class?: string; style?: any }>,
) {
	const { children, value, class: classProp, style, ...rest } = props;
	const context = useDatePickerContext();
	return (
		<button
			type="button"
			data-scope="date-picker"
			data-part="table-cell-trigger"
			data-value={value}
			class={cx(context?.styles.tableCellTrigger, classProp)}
			style={{
				width: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				cursor: "pointer",
				...style,
			}}
			{...rest}
		>
			{children}
		</button>
	);
}

function MonthSelect(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	return (
		<select
			data-scope="date-picker"
			data-part="month-select"
			class={cx(context?.styles.monthSelect, classProp)}
			{...rest}
		>
			{children ||
				MONTH_NAMES.map((name, idx) => (
					<option
						key={name}
						value={idx}
						selected={context?.focusedDate.getMonth() === idx}
					>
						{name}
					</option>
				))}
		</select>
	);
}

function YearSelect(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useDatePickerContext();
	const currentYear =
		context?.focusedDate.getFullYear() || new Date().getFullYear();
	const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

	return (
		<select
			data-scope="date-picker"
			data-part="year-select"
			class={cx(context?.styles.yearSelect, classProp)}
			{...rest}
		>
			{children ||
				years.map((year) => (
					<option key={year} value={year} selected={currentYear === year}>
						{year}
					</option>
				))}
		</select>
	);
}

interface DatePickerStructureProps {
	placeholder?: string;
	name?: string;
}

function DatePickerStructure(props: DatePickerStructureProps) {
	const { placeholder, name } = props;
	return (
		<>
			<Label />
			<Control>
				<Input placeholder={placeholder} name={name} />
				<Trigger />
				<ClearTrigger />
			</Control>
			<Positioner>
				<Content>
					<View view="day">
						<ViewControl>
							<PrevTrigger />
							<ViewTrigger />
							<NextTrigger />
						</ViewControl>
						<Table />
					</View>

					<View view="month">
						<ViewControl>
							<PrevTrigger />
							<ViewTrigger />
							<NextTrigger />
						</ViewControl>
						<Table />
					</View>

					<View view="year">
						<ViewControl>
							<PrevTrigger />
							<ViewTrigger />
							<NextTrigger />
						</ViewControl>
						<Table />
					</View>
				</Content>
			</Positioner>
		</>
	);
}

interface InteractiveDatePickerProps extends RootProps {
	onValueChange?: (details: { value: string[] }) => void;
	onOpenChange?: (details: { open: boolean }) => void;
	onViewChange?: (details: { view: "day" | "month" | "year" }) => void;
}

function InteractiveDatePicker(props: InteractiveDatePickerProps) {
	const {
		open: openProp,
		value: valueProp,
		defaultValue,
		view: viewProp,
		defaultView = "day",
		min,
		max,
		closeOnSelect = true,
		id: idProp,
		onValueChange,
		onOpenChange,
		onViewChange,
		...rest
	} = props;

	const [isOpen, setIsOpen] = useState(openProp ?? false);
	const [value, setValue] = useState<string[]>(
		valueProp ??
			(defaultValue
				? Array.isArray(defaultValue)
					? defaultValue
					: [defaultValue]
				: []),
	);
	const [view, setView] = useState<"day" | "month" | "year">(
		viewProp ?? defaultView,
	);

	const initialDate =
		value.length > 0 && !Number.isNaN(Date.parse(value[0]))
			? new Date(value[0])
			: new Date();
	const [focusedDate, setFocusedDate] = useState<Date>(initialDate);

	const isControlledOpen = openProp !== undefined;
	const isControlledValue = valueProp !== undefined;
	const isControlledView = viewProp !== undefined;

	const open = isControlledOpen ? openProp : isOpen;
	const currentValue = isControlledValue ? valueProp : value;
	const currentView = isControlledView ? viewProp : view;

	const fallbackId = useId();
	const rootId = idProp || `date-picker-${fallbackId}`;

	// Keep mutable state refs so event delegation handlers always have freshest data
	const stateRef = useRef({
		open,
		value: currentValue,
		view: currentView,
		focusedDate,
		closeOnSelect,
		isControlledOpen,
		isControlledValue,
		isControlledView,
	});

	useEffect(() => {
		stateRef.current = {
			open,
			value: currentValue,
			view: currentView,
			focusedDate,
			closeOnSelect,
			isControlledOpen,
			isControlledValue,
			isControlledView,
		};
	}, [
		open,
		currentValue,
		currentView,
		focusedDate,
		closeOnSelect,
		isControlledOpen,
		isControlledValue,
		isControlledView,
	]);

	const handleToggle = () => {
		const nextOpen = !stateRef.current.open;
		if (!stateRef.current.isControlledOpen) {
			setIsOpen(nextOpen);
		}
		onOpenChange?.({ open: nextOpen });
	};

	const handleClose = () => {
		if (stateRef.current.open) {
			if (!stateRef.current.isControlledOpen) {
				setIsOpen(false);
			}
			onOpenChange?.({ open: false });
		}
	};

	const handleClear = () => {
		if (!stateRef.current.isControlledValue) {
			setValue([]);
		}
		onValueChange?.({ value: [] });
	};

	const handleNavigate = (direction: "prev" | "next") => {
		const d = new Date(stateRef.current.focusedDate);
		const currentViewMode = stateRef.current.view;

		if (currentViewMode === "day") {
			d.setMonth(d.getMonth() + (direction === "next" ? 1 : -1));
		} else if (currentViewMode === "month") {
			d.setFullYear(d.getFullYear() + (direction === "next" ? 1 : -1));
		} else if (currentViewMode === "year") {
			d.setFullYear(d.getFullYear() + (direction === "next" ? 10 : -10));
		}

		setFocusedDate(d);
	};

	const handleViewTrigger = () => {
		const currentViewMode = stateRef.current.view;
		let nextView: "day" | "month" | "year" = "day";
		if (currentViewMode === "day") {
			nextView = "month";
		} else if (currentViewMode === "month") {
			nextView = "year";
		}

		if (!stateRef.current.isControlledView) {
			setView(nextView);
		}
		onViewChange?.({ view: nextView });
	};

	const handleCellSelect = (cellValue: string) => {
		const currentViewMode = stateRef.current.view;
		if (currentViewMode === "day") {
			if (!stateRef.current.isControlledValue) {
				setValue([cellValue]);
			}
			onValueChange?.({ value: [cellValue] });
			if (stateRef.current.closeOnSelect) {
				handleClose();
			}
		} else if (currentViewMode === "month") {
			const d = new Date(stateRef.current.focusedDate);
			d.setMonth(Number.parseInt(cellValue, 10));
			setFocusedDate(d);
			if (!stateRef.current.isControlledView) {
				setView("day");
			}
			onViewChange?.({ view: "day" });
		} else if (currentViewMode === "year") {
			const d = new Date(stateRef.current.focusedDate);
			d.setFullYear(Number.parseInt(cellValue, 10));
			setFocusedDate(d);
			if (!stateRef.current.isControlledView) {
				setView("month");
			}
			onViewChange?.({ view: "month" });
		}
	};

	const handleMonthSelectChange = (val: string) => {
		const d = new Date(stateRef.current.focusedDate);
		d.setMonth(Number.parseInt(val, 10));
		setFocusedDate(d);
	};

	const handleYearSelectChange = (val: string) => {
		const d = new Date(stateRef.current.focusedDate);
		d.setFullYear(Number.parseInt(val, 10));
		setFocusedDate(d);
	};

	// Event Handlers Setup via stable closures on ref
	const handleToggleRef = useRef(handleToggle);
	const handleCloseRef = useRef(handleClose);
	const handleClearRef = useRef(handleClear);
	const handleNavigateRef = useRef(handleNavigate);
	const handleViewTriggerRef = useRef(handleViewTrigger);
	const handleCellSelectRef = useRef(handleCellSelect);
	const handleMonthSelectRef = useRef(handleMonthSelectChange);
	const handleYearSelectRef = useRef(handleYearSelectChange);

	useEffect(() => {
		handleToggleRef.current = handleToggle;
		handleCloseRef.current = handleClose;
		handleClearRef.current = handleClear;
		handleNavigateRef.current = handleNavigate;
		handleViewTriggerRef.current = handleViewTrigger;
		handleCellSelectRef.current = handleCellSelect;
		handleMonthSelectRef.current = handleMonthSelectChange;
		handleYearSelectRef.current = handleYearSelectChange;
	});

	// Register event listeners on DOM root element
	useEffect(() => {
		const root = document.getElementById(rootId);
		if (!root) return;

		const handleClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const trigger = target.closest('[data-part="trigger"]');
			const prevTrigger = target.closest('[data-part="prev-trigger"]');
			const nextTrigger = target.closest('[data-part="next-trigger"]');
			const viewTrigger = target.closest('[data-part="view-trigger"]');
			const clearTrigger = target.closest('[data-part="clear-trigger"]');
			const cellTrigger = target.closest('[data-part="table-cell-trigger"]');

			if (trigger) {
				handleToggleRef.current();
			} else if (prevTrigger) {
				handleNavigateRef.current("prev");
			} else if (nextTrigger) {
				handleNavigateRef.current("next");
			} else if (viewTrigger) {
				handleViewTriggerRef.current();
			} else if (clearTrigger) {
				handleClearRef.current();
			} else if (cellTrigger) {
				const cellValue = cellTrigger.getAttribute("data-value") || "";
				handleCellSelectRef.current(cellValue);
			}
		};

		const handleSelectChange = (e: Event) => {
			const target = e.target as HTMLSelectElement;
			if (target.matches('[data-part="month-select"]')) {
				handleMonthSelectRef.current(target.value);
			} else if (target.matches('[data-part="year-select"]')) {
				handleYearSelectRef.current(target.value);
			}
		};

		const handleDocumentClick = (e: MouseEvent) => {
			if (!root.contains(e.target as Node)) {
				handleCloseRef.current();
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				handleCloseRef.current();
			}
		};

		root.addEventListener("click", handleClick);
		root.addEventListener("change", handleSelectChange);
		document.addEventListener("click", handleDocumentClick);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			root.removeEventListener("click", handleClick);
			root.removeEventListener("change", handleSelectChange);
			document.removeEventListener("click", handleDocumentClick);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [rootId]);

	return (
		<Root
			rootId={rootId}
			open={open}
			value={currentValue}
			focusedDate={focusedDate}
			view={currentView}
			closeOnSelect={closeOnSelect}
			min={min}
			max={max}
			{...rest}
		>
			<DatePickerStructure placeholder={props.placeholder} name={props.name} />
		</Root>
	);
}

// Group and Export Last
export {
	ClearTrigger,
	Content,
	Control,
	DatePickerContext,
	DatePickerStructure,
	Input,
	InteractiveDatePicker,
	Label,
	MonthSelect,
	NextTrigger,
	Positioner,
	PrevTrigger,
	RangeText,
	Root,
	Table,
	TableBody,
	TableCell,
	TableCellTrigger,
	TableHead,
	TableHeader,
	TableRow,
	Trigger,
	View,
	ViewContext,
	ViewControl,
	ViewTrigger,
	YearSelect,
	useDatePickerContext,
	useViewContext,
};

export type { RootProps, InteractiveDatePickerProps };
