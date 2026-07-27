import { type SortingState, type Table, flexRender } from "@tanstack/react-table";
import clsx from "clsx";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import styles from "./DataTable.module.css";
import { DataTablePagination } from "./DataTablePagination";

interface DataTableProps<TData> {
    table: Table<TData>;
    onRowClick?: (row: TData) => void;
    onRowDoubleClick?: (row: TData) => void;
    className?: string | undefined;
    children?: ReactNode;
    total?: number;
    sorting?: SortingState;
    onSort?: (columnId: string) => void;
}

export function DataTable<TData>({
    table,
    onRowClick,
    onRowDoubleClick,
    className,
    children,
    total,
    onSort
}: DataTableProps<TData>) {
    const { t } = useTranslation();

    return (
        <>
            <div className={clsx(styles["data-table-wrapper"], className)}>
                <table className={styles["data-table"]}>
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    return (
                                        <th
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className={styles["data-table__th"]}
                                            style={{
                                                width: header.getSize() !== 150 ? header.getSize() : undefined
                                            }}
                                            onClick={() => {
                                                if (header.column.getCanSort() && onSort) {
                                                    onSort(header.column.id);
                                                }
                                            }}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={table.getAllColumns().length} className={styles["data-table__empty"]}>
                                    {t("noData")}
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr
                                    key={row.id}
                                    className={clsx(
                                        onRowClick || onRowDoubleClick
                                            ? styles["data-table__row--clickable"]
                                            : undefined,
                                        row.getIsSelected() ? styles["data-table__row--selected"] : undefined
                                    )}
                                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                                    onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row.original) : undefined}
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                        {total !== undefined &&
                            table.getRowModel().rows.length > 0 &&
                            table.getRowModel().rows.length < table.getState().pagination.pageSize &&
                            Array.from(
                                { length: table.getState().pagination.pageSize - table.getRowModel().rows.length },
                                (_, i) => (
                                    <tr key={`filler-${i}`} className={styles["data-table__filler-row"]}>
                                        <td colSpan={table.getAllColumns().length} />
                                    </tr>
                                )
                            )}
                    </tbody>
                </table>
            </div>
            {total !== undefined && <DataTablePagination table={table} total={total} />}
            {children}
        </>
    );
}
