import { type ColumnDef, type RowSelectionState, type SortingState, type VisibilityState } from "@tanstack/react-table";
import type { ReactNode } from "react";

import { useTable } from "@/shared/lib/use-table";

import { DataTable } from "@/shared/ui/data-table";

export interface TableProps<TData> {
    data: TData[];
    columns: ColumnDef<TData>[];
    getRowId: (row: TData) => string;
    total: number;
    pageSize: number;
    pageIndex: number;
    onPageIndexChange: (pageIndex: number) => void;
    resetKey?: string | undefined;
    sorting?: SortingState | undefined;
    columnVisibility?: VisibilityState | undefined;
    columnOrder?: string[] | undefined;
    rowSelection?: RowSelectionState | undefined;
    onSortingChange?: ((updater: SortingState | ((prev: SortingState) => SortingState)) => void) | undefined;
    onColumnVisibilityChange?:
        | ((updater: VisibilityState | ((prev: VisibilityState) => VisibilityState)) => void)
        | undefined;
    onColumnOrderChange?: ((updater: string[] | ((prev: string[]) => string[])) => void) | undefined;
    onRowSelectionChange?:
        | ((updater: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => void)
        | undefined;
    onRowClick?: ((row: TData) => void) | undefined;
    onRowDoubleClick?: ((row: TData) => void) | undefined;
    enableRowSelection?: boolean | undefined;
    children?: ReactNode;
}

export function Table<TData>({
    data,
    columns,
    getRowId,
    total,
    pageSize,
    pageIndex,
    onPageIndexChange,
    resetKey,
    sorting,
    columnVisibility,
    columnOrder,
    rowSelection,
    onSortingChange,
    onColumnVisibilityChange,
    onColumnOrderChange,
    onRowSelectionChange,
    onRowClick,
    onRowDoubleClick,
    enableRowSelection,
    children
}: TableProps<TData>) {
    const { table } = useTable({
        data,
        columns,
        getRowId,
        total,
        pageSize,
        pageIndex,
        onPageIndexChange,
        resetKey,
        sorting,
        onSortingChange,
        columnVisibility,
        columnOrder,
        rowSelection,
        onColumnVisibilityChange,
        onColumnOrderChange,
        onRowSelectionChange,
        enableRowSelection
    });

    return (
        <DataTable
            table={table}
            total={total}
            {...(onRowClick ? { onRowClick } : {})}
            {...(onRowDoubleClick ? { onRowDoubleClick } : {})}
        >
            {children}
        </DataTable>
    );
}
