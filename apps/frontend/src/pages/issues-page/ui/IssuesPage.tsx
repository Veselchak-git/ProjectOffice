/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ISSUES } from "@helpdesk-portal/i18n";
import ExportIcon from "@helpdesk-portal/icons/Export.svg?react";
import GearIcon from "@helpdesk-portal/icons/GearIcon.svg?react";
import { Button } from "@helpdesk-portal/ui-kit";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef, type SortingState, createColumnHelper } from "@tanstack/react-table";
import { useRef, useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { rootReducer } from "@/app/store";

import type { FetchIssuesParams, Issue } from "@/entities/issue";
import { deleteIssue, fetchIssues } from "@/entities/issue";

import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { useClickOutside } from "@/shared/lib/use-click-outside";
import { useDynamicPerPage } from "@/shared/lib/use-dynamic-per-page";
import { usePersistColumnSettings } from "@/shared/lib/use-persist-column-settings";
import { useTable } from "@/shared/lib/use-table";

import {
    DataTable,
    SortableColumnItem,
    createDateColumn,
    createSelectColumn,
    reorderColumn
} from "@/shared/ui/data-table";

import { ALL_COLUMNS } from "../model/columns";
import {
    issuesPageSlice,
    selectColumnOrder,
    selectColumnVisibility,
    selectRowSelection,
    setColumnOrder,
    setColumnVisibility,
    setRowSelection
} from "../model/issues-page-slice";
import "./IssuesPage.css";

rootReducer.inject(issuesPageSlice);

const columnHelper = createColumnHelper<Issue>();

export const IssuesPage: FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(ISSUES);
    const queryClient = useQueryClient();
    const dispatch = useAppDispatch();
    const columnVisibility = useAppSelector(selectColumnVisibility);
    const columnOrder = useAppSelector(selectColumnOrder);
    const rowSelection = useAppSelector(selectRowSelection);
    const [pageIndex, setPageIndex] = useState(0);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnsOpen, setColumnsOpen] = useState(false);
    const columnsRef = useRef<HTMLDivElement>(null);

    useClickOutside(columnsRef, () => setColumnsOpen(false));

    const containerRef = useRef<HTMLDivElement>(null);
    const { perPage, ready } = useDynamicPerPage(containerRef, {
        rowHeight: 57,
        theadHeight: 41,
        paginationHeight: 36,
        min: 5
    });

    const sortBy = sorting[0]?.id;
    const sortOrder: "asc" | "desc" | undefined = sorting[0]?.desc ? "desc" : sorting[0] ? "asc" : undefined;
    const page = pageIndex + 1;

    const issueParams = {
        page,
        perPage,
        ...(sortBy ? { sortBy } : {}),
        ...(sortOrder ? { sortOrder } : {})
    } satisfies FetchIssuesParams;

    const { data, isPending, isError, error } = useQuery({
        queryKey: ["issues", issueParams],
        queryFn: () => fetchIssues(issueParams),
        enabled: ready,
        placeholderData: keepPreviousData
    });

    const issues = data?.issues ?? [];
    const total = data?.total ?? 0;

    const statusLabels: Record<string, string> = {
        NEW: t("status.new"),
        ACKNOWLEDGED: t("status.acknowledged"),
        CONFIRMED: t("status.confirmed"),
        ASSIGNED: t("status.assigned"),
        RESOLVED: t("status.resolved"),
        CLOSED: t("status.closed")
    };

    const priorityLabels: Record<string, string> = {
        CRITICAL: t("priority.critical"),
        SERIOUS: t("priority.serious"),
        MINOR: t("priority.minor"),
        GENERAL: t("priority.general")
    };

    const columns = [
        createSelectColumn(columnHelper),
        columnHelper.accessor("title", {
            header: t("table.title"),
            enableSorting: true
        }),
        columnHelper.accessor("projectName", {
            header: t("table.project"),
            enableSorting: false
        }),
        columnHelper.accessor("status", {
            header: t("table.status"),
            enableSorting: true,
            cell: info => (
                <span
                    className={`issues-table__status-badge issues-table__status-badge--${info.getValue().toLowerCase()}`}
                >
                    {statusLabels[info.getValue()] ?? info.getValue()}
                </span>
            )
        }),
        columnHelper.accessor("priority", {
            header: t("table.priority"),
            enableSorting: true,
            cell: info => (
                <span className={`issues-table__priority issues-table__priority--${info.getValue().toLowerCase()}`}>
                    {priorityLabels[info.getValue()] ?? info.getValue()}
                </span>
            )
        }),
        columnHelper.accessor("category", {
            header: t("table.category"),
            enableSorting: true,
            cell: info => t(`category.${info.getValue().toLowerCase()}`)
        }),
        columnHelper.accessor("assigneeLogin", {
            header: t("table.assignee"),
            enableSorting: false,
            cell: info => info.getValue() ?? "—"
        }),
        createDateColumn(columnHelper, t)
    ];

    const { table } = useTable({
        data: issues,
        columns: columns as ColumnDef<Issue>[],
        getRowId: row => String(row.id),
        total,
        pageSize: perPage,
        pageIndex,
        onPageIndexChange: setPageIndex,
        sorting,
        onSortingChange: setSorting,
        columnVisibility,
        columnOrder,
        rowSelection,
        onColumnOrderChange: updater => {
            const next = typeof updater === "function" ? updater(columnOrder) : updater;
            dispatch(setColumnOrder(next));
        },
        onColumnVisibilityChange: updater => {
            const next = typeof updater === "function" ? updater(columnVisibility) : updater;
            dispatch(setColumnVisibility(next));
        },
        onRowSelectionChange: updater => {
            const next = typeof updater === "function" ? updater(rowSelection) : updater;
            dispatch(setRowSelection(next));
        },
        resetKey: undefined,
        enableRowSelection: true
    });

    usePersistColumnSettings({
        page: "issues",
        columnVisibility,
        columnOrder,
        onColumnVisibilityChange: updater => {
            const next = typeof updater === "function" ? updater(columnVisibility) : updater;
            dispatch(setColumnVisibility(next));
        },
        onColumnOrderChange: updater => {
            const next = typeof updater === "function" ? updater(columnOrder) : updater;
            dispatch(setColumnOrder(next));
        }
    });

    const selectedIds = Object.keys(rowSelection).map(Number);
    const selectedCount = selectedIds.length;

    const { mutateAsync: deleteIssueMutate } = useMutation({
        mutationFn: (id: number) => deleteIssue(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["issues"] })
    });

    const handleDeleteSelected = async () => {
        if (!window.confirm(t("confirm.deleteSelected", { count: selectedCount }))) return;
        await Promise.all(selectedIds.map(id => deleteIssueMutate(id)));
        dispatch(setRowSelection({}));
    };

    function handleDragEnd(event: DragEndEvent) {
        reorderColumn(event, columnOrder, next => dispatch(setColumnOrder(next)));
    }

    return (
        <div className="issues-page">
            <div className="issues-page__title-area">
                <div className="issues-page__title-text">
                    <h1 className="issues-page__title-heading">{t("page.title")}</h1>
                    <p className="issues-page__title-subtitle">{t("page.subtitle", { total })}</p>
                </div>
                <div className="issues-page__actions">
                    {selectedCount > 0 && (
                        <Button variant="stroke" color="error" size="m" onClick={handleDeleteSelected}>
                            {t("actions.deleteSelected", { count: selectedCount })}
                        </Button>
                    )}
                    <button className="issues-page__export-btn" type="button">
                        <ExportIcon />
                        {t("actions.export")}
                    </button>
                    <div className="issues-page__columns-wrapper" ref={columnsRef}>
                        <button
                            className="issues-page__columns-btn"
                            type="button"
                            onClick={() => setColumnsOpen(v => !v)}
                        >
                            <GearIcon />
                            {t("actions.columns")}
                        </button>

                        {columnsOpen && (
                            <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                                <SortableContext items={columnOrder} strategy={verticalListSortingStrategy}>
                                    <div className="issues-page__columns-dropdown">
                                        {columnOrder
                                            .filter(id => id !== "select")
                                            .map(id => {
                                                const col = ALL_COLUMNS.find(c => c.id === id);
                                                if (!col) return null;
                                                return (
                                                    <SortableColumnItem
                                                        key={col.id}
                                                        id={col.id}
                                                        label={t(col.label)}
                                                        isVisible={table.getColumn(col.id)?.getIsVisible() ?? true}
                                                        onToggle={() => table.getColumn(col.id)?.toggleVisibility()}
                                                    />
                                                );
                                            })}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                </div>
            </div>

            <div className="issues-page__table-area" ref={containerRef}>
                {isPending && !data ? (
                    <p className="issues-page__empty">{t("loading")}</p>
                ) : isError && !data ? (
                    <p className="issues-page__empty">{error instanceof Error ? error.message : t("error.loading")}</p>
                ) : (
                    <DataTable table={table} onRowDoubleClick={row => navigate(`/tasks/${row.id}`)} total={total} />
                )}
            </div>
        </div>
    );
};
