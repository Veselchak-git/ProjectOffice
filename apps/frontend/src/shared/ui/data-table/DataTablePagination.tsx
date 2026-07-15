import ArrowLeftIcon from "@helpdesk-portal/icons/ArrowLeft.svg?react";
import ArrowRightIcon from "@helpdesk-portal/icons/ArrowRight.svg?react";
import DoubleArrowLeftIcon from "@helpdesk-portal/icons/DoubleArrowLeft.svg?react";
import DoubleArrowRightIcon from "@helpdesk-portal/icons/DoubleArrowRight.svg?react";
import { type Table } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";

interface DataTablePaginationProps<TData> {
    table: Table<TData>;
    total: number;
}

export function DataTablePagination<TData>({ table, total }: DataTablePaginationProps<TData>) {
    const { t } = useTranslation();
    const { pageIndex, pageSize } = table.getState().pagination;
    const pageCount = table.getPageCount();
    const from = total === 0 ? 0 : pageIndex * pageSize + 1;
    const to = Math.min((pageIndex + 1) * pageSize, total);
    const selectedCount = table.getSelectedRowModel().rows.length;

    return (
        <div className="data-table-pagination">
            <button
                className="data-table-pagination__btn"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
            >
                <DoubleArrowLeftIcon width={16} height={16} />
            </button>
            <button
                className="data-table-pagination__btn"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
            >
                <ArrowLeftIcon width={16} height={16} />
            </button>

            <span className="data-table-pagination__info">{t("showing", { from, to, total })}</span>

            {selectedCount > 0 && (
                <span className="data-table-pagination__selected">{t("selectedCount", { count: selectedCount })}</span>
            )}

            <button
                className="data-table-pagination__btn"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
            >
                <ArrowRightIcon width={16} height={16} />
            </button>
            <button
                className="data-table-pagination__btn"
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={!table.getCanNextPage()}
            >
                <DoubleArrowRightIcon width={16} height={16} />
            </button>
        </div>
    );
}
