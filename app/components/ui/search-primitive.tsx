import { css } from "design-system/css";
import { SearchIcon as SearchIconImport } from "../../icons/search";

const inputWrapClass = css({ position: "relative" });

const iconClass = css({
	position: "absolute",
	left: "3",
	top: "50%",
	transform: "translateY(-50%)",
	color: "fg.muted",
	pointerEvents: "none",
	zIndex: "1",
});

const inputClass = css({
	width: "full",
	pl: "10",
	pr: "4",
	py: "3",
	borderWidth: "2px",
	borderRadius: "lg",
	bg: "gray.surface.bg",
	color: "fg.default",
	borderColor: "border",
	fontSize: "md",
	transition: "all 0.2s",
	_focus: {
		outline: "none",
		borderColor: "blue.9",
		shadow: "0 0 0 3px var(--colors-blue-6)",
	},
	_placeholder: { color: "fg.muted" },
});

const SearchIcon = (props: any) => (
	<SearchIconImport width="20" height="20" {...props} />
);

export const DEFAULT_PLACEHOLDERS: Record<string, string> = {
	en: "Search...",
	zh: "搜索...",
	es: "Buscar...",
	pt: "Buscar...",
	fr: "Rechercher...",
};

export const DEFAULT_ITEM_LABELS: Record<string, string> = {
	en: "results",
	zh: "结果",
	es: "resultados",
	pt: "resultados",
	fr: "résultats",
};

export interface SearchBaseProps {
	/** Language locale code (defaults to "en") */
	locale?: string;
	/** URL of the SSG-generated JSON search index */
	src?: string;
	placeholder?: string;
	initialQuery?: string;
	/** Delay before a keystroke is applied as the active query (ms) */
	debounceMs?: number;
	/** Maximum entries shown in the autocomplete dropdown */
	maxSuggestions?: number;
	/**
	 * When set, elements carrying this attribute (e.g. "data-post-slug") are
	 * shown/hidden depending on whether their value matches an entry key.
	 */
	filterAttribute?: string;
	/** id of an element to reveal when the filtered list has zero matches */
	emptyStateId?: string;
	/** Result count shown before the index has loaded */
	total?: number;
	/** Noun used in the result count, e.g. "articles" */
	itemLabel?: string;
	/** Show the "Showing X of N" result count row (default true) */
	showCount?: boolean;
	/** No-JS fallback: submit ?q= to this path via a plain GET form */
	action?: string;
	/** Mirror the active query into the address bar as ?q= (default true) */
	syncUrl?: boolean;
}

/** Static (non-hydrated) variant: a plain GET form the server can answer. */
export function SearchBase(props: SearchBaseProps) {
	const { locale = "en", placeholder, initialQuery = "", action } = props;
	const resolvedPlaceholder =
		placeholder ?? DEFAULT_PLACEHOLDERS[locale] ?? DEFAULT_PLACEHOLDERS.en;

	const input = (
		<div class={inputWrapClass}>
			<div class={iconClass}>
				<SearchIcon />
			</div>
			<input
				type="search"
				name="q"
				placeholder={resolvedPlaceholder}
				value={initialQuery}
				class={inputClass}
			/>
		</div>
	);
	return action ? (
		<form action={action} method="get" class={css({ width: "full" })}>
			{input}
		</form>
	) : (
		<div class={css({ width: "full" })}>{input}</div>
	);
}
