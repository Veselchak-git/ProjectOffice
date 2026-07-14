import { type Table, flexRender } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import "./DataTable.css";
import { DataTablePagination } from "./DataTablePagination";

interface DataTableProps<TData> {
    table: Table<TData>;
    onRowClick?: (row: TData) => void;
    onRowDoubleClick?: (row: TData) => void;
    className?: string;
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
            <div className={`data-table-wrapper${className ? ` ${className}` : ""}`}>
                <table className="data-table">
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    const canSort = header.column.getCanSort();
                                    return (
                                        <th
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className={
                                                canSort ? "data-table__th data-table__th--sortable" : "data-table__th"
                                            }
                                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                                            style={{
                                                width: header.getSize() !== 150 ? header.getSize() : undefined
                                            }}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {canSort && (
                                                <span className="data-table__sort-icon">
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
                                <td colSpan={table.getAllColumns().length} className="data-table__empty">
                                    {t("noData")}
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr
                                    key={row.id}
                                    className={[
                                        onRowClick || onRowDoubleClick ? "data-table__row--clickable" : "",
                                        row.getIsSelected() ? "data-table__row--selected" : ""
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
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
