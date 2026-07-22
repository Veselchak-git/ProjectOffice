/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { ISSUES } from "@helpdesk-portal/i18n";
import ExportIcon from "@helpdesk-portal/icons/Export.svg?react";
import { Button } from "@helpdesk-portal/ui-kit";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { rootReducer } from "@/app/store";

import type { FetchIssuesParams, Issue } from "@/entities/issue";
import { deleteIssue, fetchIssues } from "@/entities/issue";

import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { useTable } from "@/shared/lib/use-table";
import { useTablePage } from "@/shared/lib/use-table-page";

import { ColumnsDropdown } from "@/shared/ui/columns-dropdown";
import { DataTable, createDateColumn, createSelectColumn } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

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
import styles from "./IssuesPage.module.css";

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
                    className={`${styles["issues-table__status-badge"]} ${styles[`issues-table__status-badge--${info.getValue().toLowerCase()}`]}`}
                >
                    {statusLabels[info.getValue()] ?? info.getValue()}
                </span>
            )
        }),
        columnHelper.accessor("priority", {
            header: t("table.priority"),
            enableSorting: true,
            cell: info => (
                <span
                    className={`${styles["issues-table__priority"]} ${styles[`issues-table__priority--${info.getValue().toLowerCase()}`]}`}
                >
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

    const {
        containerRef,
        columnsRef,
        columnsOpen,
        setColumnsOpen,
        handleDragEnd,
        sorting,
        perPage,
        ready,
        pageIndex,
        setPageIndex,
        setSorting
    } = useTablePage({
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

    const { table } = useTable({
        data: issues,
        columns,
        getRowId: row => String(row.id),
        total,
        pageSize: perPage,
        pageIndex,
        onPageIndexChange: setPageIndex,
        sorting,
        onSortingChange: setSorting,
        columnVisibility,
        columnOrder,
        onColumnOrderChange: updater => {
            const next = typeof updater === "function" ? updater(columnOrder) : updater;
            dispatch(setColumnOrder(next));
        },
        onColumnVisibilityChange: updater => {
            const next = typeof updater === "function" ? updater(columnVisibility) : updater;
            dispatch(setColumnVisibility(next));
        },
        rowSelection,
        onRowSelectionChange: updater => {
            const next = typeof updater === "function" ? updater(rowSelection) : updater;
            dispatch(setRowSelection(next));
        },
        enableRowSelection: true
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

    return (
        <div className={styles["issues-page"]}>
            <PageHeader
                title={t("page.title")}
                subtitle={t("page.subtitle", { total })}
                actions={
                    <>
                        {selectedCount > 0 && (
                            <Button variant="stroke" color="error" size="m" onClick={handleDeleteSelected}>
                                {t("actions.deleteSelected", { count: selectedCount })}
                            </Button>
                        )}
                        <Button className={styles["issues-page__export-btn"]} type="button" startIcon={<ExportIcon />}>
                            {t("actions.export")}
                        </Button>
                        <ColumnsDropdown
                            columnsRef={columnsRef}
                            columnsOpen={columnsOpen}
                            setColumnsOpen={setColumnsOpen}
                            columnOrder={columnOrder}
                            allColumns={ALL_COLUMNS}
                            table={table}
                            handleDragEnd={handleDragEnd}
                            exclude={["select"]}
                        />
                    </>
                }
            />

            <div className={styles["issues-page__table-area"]} ref={containerRef}>
                {isPending && !data ? (
                    <p className={styles["issues-page__empty"]}>{t("loading")}</p>
                ) : isError && !data ? (
                    <p className={styles["issues-page__empty"]}>
                        {error instanceof Error ? error.message : t("error.loading")}
                    </p>
                ) : (
                    <DataTable
                        table={table}
                        onRowDoubleClick={row => navigate(`/tasks/${row.id}`)}
                        total={total}
                        className={styles["issues-page__table"]}
                    />
                )}
            </div>
        </div>
    );
};
