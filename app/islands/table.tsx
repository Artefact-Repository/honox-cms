import { TableBase, type TableProps } from "../components/ui/table-primitive";

export default function TableIsland<T = Record<string, unknown>>(
	props: TableProps<T>,
) {
	return <TableBase {...props} />;
}
