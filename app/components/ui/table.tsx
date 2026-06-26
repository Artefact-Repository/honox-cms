import TableIsland from "../../islands/table";
import {
	TableBase,
	type TableColumn,
	type TableProps,
	type TableRow,
} from "./table-primitive";

export function Table<T = Record<string, unknown>>(props: TableProps<T>) {
	if (props.interactive) {
		return <TableIsland {...props} />;
	}
	return <TableBase {...props} />;
}

export type { TableColumn, TableProps, TableRow };
