import { Checkbox } from "@helpdesk-portal/ui-kit";
import { type ColumnDef, type ColumnHelper } from "@tanstack/react-table";

import { formatDate } from "@/shared/lib/format-date";

export interface ColumnDefMeta {
    id: string;
    label: string;
}

export interface ColumnMetaResult {
    ALL_COLUMNS: ColumnDefMeta[];
    COLUMN_IDS: string[];
    DEFAULT_COLUMN_ORDER: string[];
    DEFAULT_COLUMN_VISIBILITY: Record<string, boolean>;
}

export function createColumnMeta(columns: ColumnDefMeta[]): ColumnMetaResult {
    const ids = columns.map(c => c.id);
    return {
        ALL_COLUMNS: columns,
        COLUMN_IDS: ids,
        DEFAULT_COLUMN_ORDER: ["select", ...ids],
        DEFAULT_COLUMN_VISIBILITY: Object.fromEntries(columns.map(col => [col.id, true]))
    };
}

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
