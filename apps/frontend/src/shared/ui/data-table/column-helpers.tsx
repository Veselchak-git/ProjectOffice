import { Checkbox } from "@helpdesk-portal/ui-kit";
import { type ColumnDef, type ColumnHelper } from "@tanstack/react-table";

import { formatDate } from "@/shared/lib/format-date";

export function createDateColumn<TData extends { createdAt: string }>(
    columnHelper: ColumnHelper<TData>,
    t: (key: string) => string
): ColumnDef<TData> {
    return columnHelper.accessor((row: TData) => row.createdAt, {
        id: "createdAt",
        header: t("table.created"),
        enableSorting: true,
        cell: info => formatDate(info.getValue())
    });
}

export function createSelectColumn<TData>(columnHelper: ColumnHelper<TData>): ColumnDef<TData> {
    return columnHelper.display({
        id: "select",
        size: 48,
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
            <Checkbox
                inputSize="m"
                checked={table.getIsAllRowsSelected()}
                indeterminate={table.getIsSomeRowsSelected()}
                onCheckedChange={checked => table.toggleAllRowsSelected(checked)}
            />
        ),
        cell: ({ row }) => (
            <Checkbox inputSize="m" checked={row.getIsSelected()} onCheckedChange={row.getToggleSelectedHandler()} />
        )
    });
}
