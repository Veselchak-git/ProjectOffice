import { type Table, flexRender } from "@tanstack/react-table";
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
}

export function DataTable<TData>({
    table,
    onRowClick,
    onRowDoubleClick,
    className,
    children,
    total
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
                                    const canSort = header.column.getCanSort();
                                    return (
                                        <th
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className={clsx(
                                                styles["data-table__th"],
                                                canSort && styles["data-table__th--sortable"]
                                            )}
                                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                                            style={{
                                                width: header.getSize() !== 150 ? header.getSize() : undefined
                                            }}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {canSort && (
                                                <span className={styles["data-table__sort-icon"]}>
                                                    {{
                                                        asc: " ▲",
                                                        desc: " ▼"
                                                    }[header.column.getIsSorted() as string] ?? " ▸"}
                                                </span>
                                            )}
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
                    </tbody>
                </table>
            </div>
            {total !== undefined && <DataTablePagination table={table} total={total} />}
            {children}
        </>
    );
}
