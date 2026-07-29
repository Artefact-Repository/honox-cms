import { useMemo, useState } from "hono/jsx";
import { TableBase, type TableProps } from "../components/ui/table-primitive";

interface SortState {
	key: string;
	direction: "asc" | "desc";
}

function compareValues(
	a: string | number | undefined,
	b: string | number | undefined,
): number {
	if (a == null && b == null) return 0;
	if (a == null) return 1;
	if (b == null) return -1;
	if (typeof a === "number" && typeof b === "number") return a - b;
	return String(a).localeCompare(String(b));
}

export default function TableIsland<T = Record<string, unknown>>(
	props: TableProps<T>,
) {
	const [sort, setSort] = useState<SortState | null>(null);
	const sortedColumn = props.columns?.find(
		(column) => column.key === sort?.key,
	);

	const rows = useMemo(() => {
		if (!props.rows || !sort || !sortedColumn) return props.rows;
		const getValue =
			sortedColumn.sortValue ??
			((row: T) =>
				(row as Record<string, unknown>)[sortedColumn.key] as
					| string
					| number
					| undefined);
		const sorted = [...props.rows].sort((a, b) =>
			compareValues(getValue(a), getValue(b)),
		);
		if (sort.direction === "desc") sorted.reverse();
		return sorted;
	}, [props.rows, sort, sortedColumn]);

	const handleSort = (key: string) => {
		setSort((prev) =>
			prev?.key === key
				? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
				: { key, direction: "asc" },
		);
	};

	return (
		<TableBase
			{...props}
			rows={rows}
			sortColumn={sort?.key}
			sortDirection={sort?.direction}
			onSort={handleSort}
		/>
	);
}
