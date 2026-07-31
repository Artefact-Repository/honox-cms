import { cx } from "design-system/css";
import { search } from "design-system/recipes";
import { useEffect, useId, useMemo, useRef, useState } from "hono/jsx";
import { CloseIcon } from "../icons/close";
import { SearchIcon as SearchIconImport } from "../icons/search";
import {
	filterEntries,
	type SearchIndexDocument,
	type SearchIndexEntry,
	tokenize,
} from "../utils/search";

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
			{highlightSegments(text, tokens).map((segment, index) =>
				segment.match ? (
					<mark
						key={index}
						style={{
							backgroundColor: "var(--colors-amber-5)",
							color: "inherit",
							borderRadius: "2px",
						}}
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

function localiseSearchSrc(url: string, locale: string): string {
	if (locale === "en" || !url.endsWith("/search.json")) return url;
	return url.replace(/\/search\.json$/, `/${locale}/search.json`);
}

export interface SearchBaseProps {
	locale?: string;
	src?: string;
	placeholder?: string;
	initialQuery?: string;
	debounceMs?: number;
	maxSuggestions?: number;
	filterAttribute?: string;
	emptyStateId?: string;
	total?: number;
	itemLabel?: string;
	showCount?: boolean;
	action?: string;
	syncUrl?: boolean;
	variant?: "outline" | "surface" | "subtle";
	size?: "sm" | "md" | "lg";
	class?: string;
	style?: any;
}

export function InteractiveSearch(props: SearchBaseProps) {
	const [variantProps, localProps] = search.splitVariantProps(props);
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
		class: classProp,
		style,
		...rest
	} = localProps;

	const styles = search(variantProps);

	const resolvedPlaceholder =
		placeholder ?? DEFAULT_PLACEHOLDERS[locale] ?? DEFAULT_PLACEHOLDERS.en;
	const resolvedItemLabel =
		itemLabel ?? DEFAULT_ITEM_LABELS[locale] ?? DEFAULT_ITEM_LABELS.en;

	const defaultSrc = "/api/posts/search.json";
	const baseSrc = src ?? defaultSrc;
	const resolvedSrc = localiseSearchSrc(baseSrc, locale);

	const t = DEFAULT_TRANSLATIONS[locale] ?? DEFAULT_TRANSLATIONS.en;

	const [rawQuery, setRawQuery] = useState(initialQuery);
	const [query, setQuery] = useState(initialQuery);
	const [entries, setEntries] = useState<SearchIndexEntry[] | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [open, setOpen] = useState(false);
	const [highlighted, setHighlighted] = useState(-1);
	const fetchStarted = useRef(false);

	const fallbackId = useId();
	const rootId = `search-root-${fallbackId}`;
	const listboxId = `search-listbox-${fallbackId}`;

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
			// Lets an unrelated island filtering the same elements (e.g.
			// task-pagination.tsx, which pages the same `filterAttribute` rows)
			// know a search is active, without coupling the two directly.
			window.dispatchEvent(
				new CustomEvent("search:filter", {
					detail: { filterAttribute, query, matchCount: matches.length },
				}),
			);
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

	// Auto scroll highlighted suggestion into view
	useEffect(() => {
		if (highlighted !== -1 && open) {
			const root = document.getElementById(rootId);
			if (root) {
				const list = root.querySelector('[role="listbox"]') as HTMLElement;
				const item = root.querySelector(
					`[role="option"][id$="-option-${highlighted}"]`,
				) as HTMLElement;
				if (list && item) {
					const listRect = list.getBoundingClientRect();
					const itemRect = item.getBoundingClientRect();
					if (itemRect.bottom > listRect.bottom) {
						list.scrollTop += itemRect.bottom - listRect.bottom;
					} else if (itemRect.top < listRect.top) {
						list.scrollTop -= listRect.top - itemRect.top;
					}
				}
			}
		}
	}, [highlighted, open, rootId]);

	// Close on outside click/pointerdown
	useEffect(() => {
		const root = document.getElementById(rootId);
		if (!root) return;
		const handleDocumentClick = (e: MouseEvent) => {
			if (!root.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("pointerdown", handleDocumentClick);
		return () => {
			document.removeEventListener("pointerdown", handleDocumentClick);
		};
	}, [rootId]);

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
			<div class={styles.inputWrap}>
				<div class={styles.icon}>
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
					class={styles.input}
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
					onKeyDown={handleKeyDown}
					{...rest}
				/>
				{rawQuery && (
					<button
						type="button"
						aria-label="clear"
						class={styles.clearTrigger}
						onClick={() => {
							setRawQuery("");
							setQuery("");
							setHighlighted(-1);
							const root = document.getElementById(rootId);
							const input = root?.querySelector(
								'input[type="search"]',
							) as HTMLElement | null;
							input?.focus();
						}}
					>
						<CloseIcon width="16" height="16" />
					</button>
				)}
				{showDropdown && (
					<div id={listboxId} role="listbox" class={styles.listbox}>
						{!matches && <div class={styles.status}>{t.loading}</div>}
						{matches && suggestions.length === 0 && (
							<div class={styles.status}>
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
								data-highlighted={index === highlighted ? "" : undefined}
								class={styles.item}
								onMouseDown={(event: Event) => {
									event.preventDefault();
									navigateTo(entry);
								}}
								onMouseOver={() => setHighlighted(index)}
								onFocus={() => setHighlighted(index)}
							>
								<div class={styles.itemTitle}>
									<Highlighted text={entry.title} tokens={tokens} />
								</div>
								{entry.description && (
									<div class={styles.itemDescription}>
										<Highlighted text={entry.description} tokens={tokens} />
									</div>
								)}
								{entry.tags && entry.tags.length > 0 && (
									<div class={styles.itemTags}>{entry.tags.join(" · ")}</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
			{showCount && (
				<div
					style={{
						marginTop: "0.5rem",
						display: "flex",
						alignItems: "center",
						gap: "0.75rem",
					}}
				>
					<span class={styles.countText}>
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
							style={{
								color:
									"var(--colors-color-palette-plain-fg, var(--colors-blue-10))",
								fontWeight: "500",
								cursor: "pointer",
								background: "transparent",
								border: "none",
								padding: "0",
								fontSize: "0.875rem",
								textDecoration: "none",
							}}
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
			id={rootId}
			action={action}
			method="get"
			onSubmit={(event: Event) => event.preventDefault()}
			class={cx(styles.root, classProp)}
			style={style}
		>
			{body}
		</form>
	) : (
		<div id={rootId} class={cx(styles.root, classProp)} style={style}>
			{body}
		</div>
	);
}

export default function SearchIsland(props: SearchBaseProps) {
	return <InteractiveSearch {...props} />;
}
