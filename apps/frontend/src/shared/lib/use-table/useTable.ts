import {
    type ColumnDef,
    type OnChangeFn,
    type PaginationState,
    type RowSelectionState,
    type SortingState,
    type TableState,
    type Updater,
    type VisibilityState,
    getCoreRowModel,
    useReactTable
} from "@tanstack/react-table";
import { useCallback, useMemo, useRef } from "react";

export interface UseTableOptions<TData> {
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
    onSortingChange?: OnChangeFn<SortingState> | undefined;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState> | undefined;
    onColumnOrderChange?: OnChangeFn<string[]> | undefined;
    onRowSelectionChange?: OnChangeFn<RowSelectionState> | undefined;
    enableRowSelection?: boolean | undefined;
}

export interface UseTableResult<TData> {
    table: ReturnType<typeof useReactTable<TData>>;
}

export function useTable<TData>({
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
    enableRowSelection
}: UseTableOptions<TData>): UseTableResult<TData> {
    const prevResetKey = useRef(resetKey);
    if (resetKey !== prevResetKey.current) {
        prevResetKey.current = resetKey;
        onPageIndexChange(0);
    }

    const prevPageSize = useRef(pageSize);
    if (pageSize !== prevPageSize.current) {
        const oldPageSize = prevPageSize.current;
        prevPageSize.current = pageSize;
        const oldOffset = pageIndex * oldPageSize;
        const newPageIndex = Math.floor(oldOffset / pageSize);
        if (newPageIndex !== pageIndex) {
            onPageIndexChange(newPageIndex);
        }
    }

    const pagination = useMemo<PaginationState>(() => ({ pageIndex, pageSize }), [pageIndex, pageSize]);

    const handlePaginationChange = useCallback(
        (updater: Updater<PaginationState>) => {
            const next = typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
            onPageIndexChange(next.pageIndex);
        },
        [pageIndex, pageSize, onPageIndexChange]
    );

    const handleSortingChange: OnChangeFn<SortingState> = useCallback(
        (updater: Updater<SortingState>) => {
            onSortingChange?.(updater);
            onPageIndexChange(0);
        },
        [onSortingChange, onPageIndexChange]
    );

    const stableState = useMemo(() => {
        const state: Partial<TableState> = { pagination };
        if (sorting !== undefined) state.sorting = sorting;
        if (columnVisibility !== undefined) state.columnVisibility = columnVisibility;
        if (columnOrder !== undefined) state.columnOrder = columnOrder;
        if (rowSelection !== undefined) state.rowSelection = rowSelection;
        return state;
    }, [pagination, sorting, columnVisibility, columnOrder, rowSelection]);

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,
        columns,
        getRowId,
        state: stableState,
        onPaginationChange: handlePaginationChange,
        onSortingChange: handleSortingChange,
        ...(onColumnVisibilityChange !== undefined ? { onColumnVisibilityChange } : {}),
        ...(onColumnOrderChange !== undefined ? { onColumnOrderChange } : {}),
        ...(onRowSelectionChange !== undefined ? { onRowSelectionChange } : {}),
        manualPagination: true,
        manualSorting: true,
        pageCount: pageSize > 0 ? Math.ceil(total / pageSize) : -1,
        getCoreRowModel: getCoreRowModel(),
        ...(enableRowSelection !== undefined ? { enableRowSelection } : {})
    });

    return { table };
}
