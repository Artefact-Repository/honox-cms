import { css, cx } from "design-system/css";
import { useEffect, useId, useMemo, useRef, useState } from "hono/jsx";
import { SearchIcon as SearchIconImport } from "../icons/search";
import {
	filterEntries,
	type SearchIndexDocument,
	type SearchIndexEntry,
	tokenize,
} from "../utils/search";

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

const countRowClass = css({
	mt: "2",
	display: "flex",
	alignItems: "center",
	gap: "3",
	fontSize: "sm",
	color: "fg.muted",
});

const SearchIcon = (props: any) => (
	<SearchIconImport width="20" height="20" {...props} />
);

// Split `text` into plain and highlighted segments for the given tokens
function highlightSegments(
	text: string,
	tokens: string[],
): Array<{ match: boolean; text: string }> {
	if (tokens.length === 0) {
		return [{ match: false, text }];
	}
	const lower = text.toLowerCase();
	const segments: Array<{ match: boolean; text: string }> = [];
	let pos = 0;
	while (pos < text.length) {
		let found = -1;
		let foundLength = 0;
		for (const token of tokens) {
			const index = lower.indexOf(token, pos);
			if (index !== -1 && (found === -1 || index < found)) {
				found = index;
				foundLength = token.length;
			}
		}
		if (found === -1) {
			segments.push({ match: false, text: text.slice(pos) });
			break;
		}
		if (found > pos) {
			segments.push({ match: false, text: text.slice(pos, found) });
		}
		segments.push({
			match: true,
			text: text.slice(found, found + foundLength),
		});
		pos = found + foundLength;
	}
	return segments;
}

function Highlighted({ text, tokens }: { text: string; tokens: string[] }) {
	return (
		<>
			{highlightSegments(text, tokens).map((segment) =>
				segment.match ? (
					<mark
						class={css({
							bg: "amber.5",
							color: "inherit",
							borderRadius: "xs",
						})}
					>
						{segment.text}
					</mark>
				) : (
					segment.text
				),
			)}
		</>
	);
}

const DEFAULT_PLACEHOLDERS: Record<string, string> = {
	en: "Search...",
	zh: "搜索...",
	es: "Buscar...",
	pt: "Buscar...",
	fr: "Rechercher...",
};

const DEFAULT_ITEM_LABELS: Record<string, string> = {
	en: "results",
	zh: "结果",
	es: "resultados",
	pt: "resultados",
	fr: "résultats",
};

const DEFAULT_TRANSLATIONS: Record<
	string,
	{
		loading: string;
		noMatches: string;
		showingResults: string;
		totalResults: string;
		forQuery: string;
		clear: string;
	}
> = {
	en: {
		loading: "Loading…",
		noMatches: 'No matches for "{query}"',
		showingResults: "Showing {count} of {total} {label}",
		totalResults: "{total} {label}",
		forQuery: ' for "{query}"',
		clear: "Clear",
	},
	zh: {
		loading: "加载中…",
		noMatches: '无匹配 "{query}" 的结果',
		showingResults: "显示 {total} 个{label}中的 {count} 个",
		totalResults: "{total} 个{label}",
		forQuery: ' 针对 "{query}"',
		clear: "清除",
	},
	es: {
		loading: "Cargando…",
		noMatches: 'No hay coincidencias para "{query}"',
		showingResults: "Mostrando {count} de {total} {label}",
		totalResults: "{total} {label}",
		forQuery: ' para "{query}"',
		clear: "Limpiar",
	},
	pt: {
		loading: "Carregando…",
		noMatches: 'Nenhum resultado para "{query}"',
		showingResults: "Exibindo {count} de {total} {label}",
		totalResults: "{total} {label}",
		forQuery: ' para "{query}"',
		clear: "Limpar",
	},
	fr: {
		loading: "Chargement…",
		noMatches: 'Aucun résultat pour "{query}"',
		showingResults: "Affichage de {count} sur {total} {label}",
		totalResults: "{total} {label}",
		forQuery: ' pour "{query}"',
		clear: "Effacer",
	},
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

export function InteractiveSearch(props: SearchBaseProps) {
	const {
		locale = "en",
		src,
		placeholder,
		initialQuery = "",
		debounceMs = 150,
		maxSuggestions = 8,
		filterAttribute,
		emptyStateId,
		total,
		itemLabel,
		showCount = true,
		action,
		syncUrl = true,
	} = props;

	const resolvedPlaceholder =
		placeholder ?? DEFAULT_PLACEHOLDERS[locale] ?? DEFAULT_PLACEHOLDERS.en;
	const resolvedItemLabel =
		itemLabel ?? DEFAULT_ITEM_LABELS[locale] ?? DEFAULT_ITEM_LABELS.en;

	const defaultSrc = "/api/posts/search.json";
	const baseSrc = src ?? defaultSrc;
	const resolvedSrc =
		locale !== "en" && baseSrc.endsWith("/search.json")
			? baseSrc.replace(/\/search\.json$/, `/${locale}/search.json`)
			: baseSrc;

	const t = DEFAULT_TRANSLATIONS[locale] ?? DEFAULT_TRANSLATIONS.en;

	const [rawQuery, setRawQuery] = useState(initialQuery);
	const [query, setQuery] = useState(initialQuery);
	const [entries, setEntries] = useState<SearchIndexEntry[] | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [open, setOpen] = useState(false);
	const [highlighted, setHighlighted] = useState(-1);
	const fetchStarted = useRef(false);
	const listboxId = `search-listbox-${useId()}`;

	const ensureLoaded = () => {
		if (fetchStarted.current) return;
		fetchStarted.current = true;
		fetch(resolvedSrc)
			.then((response) => {
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				return response.json() as Promise<SearchIndexDocument>;
			})
			.then((document_) => setEntries(document_.entries))
			.catch((error) => {
				console.error(
					`Search: failed to load index from ${resolvedSrc}:`,
					error,
				);
				setLoadFailed(true);
			});
	};

	// On static (SSG) deployments the page is prerendered without query
	// params, so pick up ?q= from the URL once hydrated.
	useEffect(() => {
		const urlQuery = new URLSearchParams(window.location.search).get("q");
		if (urlQuery !== null && urlQuery !== initialQuery) {
			setRawQuery(urlQuery);
			setQuery(urlQuery);
		}
		if (urlQuery || initialQuery) {
			ensureLoaded();
		}
	}, []);

	// Debounce keystrokes into the active query
	useEffect(() => {
		const timer = setTimeout(() => setQuery(rawQuery), debounceMs);
		return () => clearTimeout(timer);
	}, [rawQuery, debounceMs]);

	const tokens = useMemo(() => tokenize(query), [query]);
	const matches = useMemo(
		() => (entries ? filterEntries(entries, query) : null),
		[entries, query],
	);
	const suggestions = query && matches ? matches.slice(0, maxSuggestions) : [];

	// Filter server-rendered elements in place + keep the URL shareable
	useEffect(() => {
		if (matches && filterAttribute) {
			const matchedKeys = new Set(matches.map((match) => match.key));
			for (const element of document.querySelectorAll<HTMLElement>(
				`[${filterAttribute}]`,
			)) {
				const key = element.getAttribute(filterAttribute) ?? "";
				element.hidden = !matchedKeys.has(key);
			}
			if (emptyStateId) {
				const emptyState = document.getElementById(emptyStateId);
				if (emptyState) {
					emptyState.hidden = matches.length !== 0;
				}
			}
		}
		if (syncUrl) {
			const url = new URL(window.location.href);
			if (query) {
				url.searchParams.set("q", query);
			} else {
				url.searchParams.delete("q");
			}
			window.history.replaceState(null, "", url);
		}
	}, [matches, filterAttribute, emptyStateId, query, syncUrl]);

	const navigateTo = (entry: SearchIndexEntry) => {
		window.location.assign(entry.href);
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === "ArrowDown" && suggestions.length > 0) {
			event.preventDefault();
			setOpen(true);
			setHighlighted((prev) => (prev + 1) % suggestions.length);
		} else if (event.key === "ArrowUp" && suggestions.length > 0) {
			event.preventDefault();
			setHighlighted(
				(prev) => (prev - 1 + suggestions.length) % suggestions.length,
			);
		} else if (event.key === "Enter") {
			event.preventDefault();
			const target = suggestions[highlighted];
			if (open && target) {
				navigateTo(target);
			}
		} else if (event.key === "Escape") {
			if (open) {
				setOpen(false);
			} else {
				setRawQuery("");
			}
		}
	};

	const showDropdown = open && query !== "" && !loadFailed;
	const activeId =
		highlighted >= 0 && highlighted < suggestions.length
			? `${listboxId}-option-${highlighted}`
			: undefined;

	const body = (
		<>
			<div class={inputWrapClass}>
				<div class={iconClass}>
					<SearchIcon />
				</div>
				<input
					type="search"
					name="q"
					role="combobox"
					aria-expanded={showDropdown}
					aria-controls={listboxId}
					aria-autocomplete="list"
					aria-activedescendant={activeId}
					placeholder={resolvedPlaceholder}
					value={rawQuery}
					class={inputClass}
					onInput={(event: Event) => {
						setRawQuery((event.target as HTMLInputElement).value);
						setHighlighted(-1);
						setOpen(true);
						ensureLoaded();
					}}
					onFocus={() => {
						ensureLoaded();
						if (rawQuery) setOpen(true);
					}}
					onBlur={() => setOpen(false)}
					onKeyDown={handleKeyDown}
				/>
				{showDropdown && (
					<div
						id={listboxId}
						role="listbox"
						class={css({
							position: "absolute",
							top: "calc(100% + 6px)",
							left: "0",
							right: "0",
							bg: "gray.surface.bg",
							borderWidth: "1px",
							borderColor: "gray.outline.border",
							borderRadius: "lg",
							shadow: "lg",
							zIndex: "50",
							maxHeight: "80",
							overflowY: "auto",
							p: "1",
						})}
					>
						{!matches && (
							<div class={css({ px: "4", py: "3", color: "fg.muted" })}>
								{t.loading}
							</div>
						)}
						{matches && suggestions.length === 0 && (
							<div class={css({ px: "4", py: "3", color: "fg.muted" })}>
								{t.noMatches.replace("{query}", query)}
							</div>
						)}
						{suggestions.map((entry, index) => (
							<div
								key={entry.key}
								id={`${listboxId}-option-${index}`}
								role="option"
								tabIndex={-1}
								aria-selected={index === highlighted}
								class={cx(
									css({
										px: "3",
										py: "2.5",
										borderRadius: "md",
										cursor: "pointer",
									}),
									index === highlighted && css({ bg: "blue.3" }),
								)}
								onMouseDown={(event: Event) => {
									event.preventDefault();
									navigateTo(entry);
								}}
								onMouseOver={() => setHighlighted(index)}
								onFocus={() => setHighlighted(index)}
							>
								<div class={css({ fontWeight: "medium", color: "fg.default" })}>
									<Highlighted text={entry.title} tokens={tokens} />
								</div>
								{entry.description && (
									<div
										class={css({
											fontSize: "sm",
											color: "fg.muted",
											lineClamp: "2",
											mt: "0.5",
										})}
									>
										<Highlighted text={entry.description} tokens={tokens} />
									</div>
								)}
								{entry.tags && entry.tags.length > 0 && (
									<div
										class={css({
											fontSize: "xs",
											color: "blue.10",
											mt: "1",
										})}
									>
										{entry.tags.join(" · ")}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
			{showCount && (
				<div class={countRowClass}>
					<span>
						{matches
							? t.showingResults
									.replace("{count}", String(matches.length))
									.replace("{total}", String(entries?.length ?? 0))
									.replace("{label}", resolvedItemLabel)
							: total !== undefined
								? t.totalResults
										.replace("{total}", String(total))
										.replace("{label}", resolvedItemLabel)
								: ""}
						{matches && query ? t.forQuery.replace("{query}", query) : ""}
					</span>
					{rawQuery && (
						<button
							type="button"
							onClick={() => {
								setRawQuery("");
								setQuery("");
							}}
							class={css({
								color: "blue.10",
								fontWeight: "medium",
								cursor: "pointer",
								bg: "transparent",
								border: "none",
								p: "0",
								fontSize: "sm",
								_hover: { textDecoration: "underline" },
							})}
						>
							{t.clear}
						</button>
					)}
				</div>
			)}
		</>
	);

	return action ? (
		<form
			action={action}
			method="get"
			onSubmit={(event: Event) => event.preventDefault()}
			class={css({ width: "full" })}
		>
			{body}
		</form>
	) : (
		<div class={css({ width: "full" })}>{body}</div>
	);
}

export default function SearchIsland(props: SearchBaseProps) {
	return <InteractiveSearch {...props} />;
}
