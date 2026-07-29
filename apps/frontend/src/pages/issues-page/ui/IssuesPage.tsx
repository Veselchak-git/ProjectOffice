/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { ISSUES } from "@helpdesk-portal/i18n";
import ExportIcon from "@helpdesk-portal/icons/Export.svg?react";
import { Button, Chip } from "@helpdesk-portal/ui-kit";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";

import type { FetchIssuesParams, Issue } from "@/entities/issue";
import { deleteIssue, fetchIssues } from "@/entities/issue";

import { ErrorModal } from "@/shared/lib/error-boundary/ErrorModal";
import { formatDate } from "@/shared/lib/format-date";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { useTable } from "@/shared/lib/use-table";
import { useFilterState, usePopoverKeys } from "@/shared/lib/use-table-filter";
import type { FieldOption } from "@/shared/lib/use-table-filter/types";
import { useTablePage } from "@/shared/lib/use-table-page";

import { ColumnsDropdown } from "@/shared/ui/columns-dropdown";
import { DataTable, FilterChips, useFilterHeader } from "@/shared/ui/data-table";
import { createSelectColumn } from "@/shared/ui/data-table/column-helpers";
import { ExportModal } from "@/shared/ui/export-modal";
import { PageHeader } from "@/shared/ui/page-header";

import { ALL_COLUMNS } from "../model/columns";
import {
    selectColumnOrder,
    selectColumnVisibility,
    selectRowSelection,
    setColumnOrder,
    setColumnVisibility,
    setRowSelection
} from "../model/issues-page-slice";
import styles from "./IssuesPage.module.css";

export const IssuesPage: FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(ISSUES);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const dispatch = useAppDispatch();
    const columnVisibility = useAppSelector(selectColumnVisibility);
    const columnOrder = useAppSelector(selectColumnOrder);
    const rowSelection = useAppSelector(selectRowSelection);
    const filterConfig = useMemo<{ fields: FieldOption[] }>(
        () => ({
            fields: [
                {
                    field: "status",
                    label: t("filter.status"),
                    type: "enum",
                    enumValues: [
                        { value: "NEW", label: t("filter.statusOptions.NEW") },
                        { value: "ACKNOWLEDGED", label: t("filter.statusOptions.ACKNOWLEDGED") },
                        { value: "CONFIRMED", label: t("filter.statusOptions.CONFIRMED") },
                        { value: "ASSIGNED", label: t("filter.statusOptions.ASSIGNED") },
                        { value: "RESOLVED", label: t("filter.statusOptions.RESOLVED") },
                        { value: "CLOSED", label: t("filter.statusOptions.CLOSED") }
                    ]
                },
                {
                    field: "priority",
                    label: t("filter.priority"),
                    type: "enum",
                    enumValues: [
                        { value: "CRITICAL", label: t("filter.priorityOptions.CRITICAL") },
                        { value: "SERIOUS", label: t("filter.priorityOptions.SERIOUS") },
                        { value: "MINOR", label: t("filter.priorityOptions.MINOR") },
                        { value: "GENERAL", label: t("filter.priorityOptions.GENERAL") }
                    ]
                },
                {
                    field: "category",
                    label: t("filter.category"),
                    type: "enum",
                    enumValues: [
                        { value: "BUG", label: t("filter.categoryOptions.BUG") },
                        { value: "FEATURE", label: t("filter.categoryOptions.FEATURE") },
                        { value: "TASK", label: t("filter.categoryOptions.TASK") },
                        { value: "IMPROVEMENT", label: t("filter.categoryOptions.IMPROVEMENT") },
                        { value: "QUESTION", label: t("filter.categoryOptions.QUESTION") }
                    ]
                },
                { field: "projectName", label: t("filter.projectName"), type: "text" },
                { field: "title", label: t("filter.title"), type: "text" },
                { field: "assigneeLogin", label: t("filter.assigneeLogin"), type: "text" },
                { field: "createdAt", label: t("filter.createdAt"), type: "date" }
            ]
        }),
        [t]
    );
    const {
        filters,
        resetFilters,
        hasActiveFilters,
        filterQueryString,
        removeCondition,
        allConditions,
        currentLogic,
        applyConditions,
        removeFieldConditions
    } = useFilterState("issues", filterConfig);

    // --- Apply filter from URL query param on first mount ---
    const [searchParams, setSearchParams] = useSearchParams();
    const urlFilterApplied = useRef(false);

    useEffect(() => {
        if (urlFilterApplied.current) return;
        const rawFilter = searchParams.get("filter");
        if (!rawFilter) return;

        try {
            const parsed = JSON.parse(rawFilter);
            if (
                parsed &&
                typeof parsed === "object" &&
                Array.isArray(parsed.conditions) &&
                (parsed.logic === "AND" || parsed.logic === "OR")
            ) {
                const conditions = parsed.conditions.map(
                    (c: { field: string; operator: string; value: string | string[] }) => ({
                        id: crypto.randomUUID(),
                        field: c.field,
                        operator: c.operator,
                        value: c.value
                    })
                );
                applyConditions(conditions, parsed.logic);
                urlFilterApplied.current = true;
                setSearchParams(
                    prev => {
                        const next = new URLSearchParams(prev);
                        next.delete("filter");
                        return next;
                    },
                    { replace: true }
                );
            }
        } catch {
            // ignore invalid filter JSON
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const [openFilter, setOpenFilter] = useState<string | null>(null);
    const [exportOpen, setExportOpen] = useState(false);
    const { popoverKeys, bumpKey } = usePopoverKeys();

    const statusLabels = useMemo(
        () => ({
            NEW: t("status.new"),
            ACKNOWLEDGED: t("status.acknowledged"),
            CONFIRMED: t("status.confirmed"),
            ASSIGNED: t("status.assigned"),
            RESOLVED: t("status.resolved"),
            CLOSED: t("status.closed")
        }),
        [t]
    );

    const priorityLabels = useMemo(
        () => ({
            CRITICAL: t("priority.critical"),
            SERIOUS: t("priority.serious"),
            MINOR: t("priority.minor"),
            GENERAL: t("priority.general")
        }),
        [t]
    );

    const getStatusChipColor = useCallback((status: string): "orange" | "neutral" | "red" | "green" => {
        switch (status) {
            case "NEW":
                return "orange";
            case "ACKNOWLEDGED":
                return "neutral";
            case "CONFIRMED":
                return "orange";
            case "ASSIGNED":
                return "red";
            case "RESOLVED":
                return "green";
            case "CLOSED":
                return "neutral";
            default:
                return "neutral";
        }
    }, []);

    const getPriorityChipColor = useCallback((priority: string): "orange" | "neutral" | "red" => {
        switch (priority) {
            case "CRITICAL":
                return "red";
            case "SERIOUS":
                return "orange";
            case "MINOR":
                return "orange";
            case "GENERAL":
                return "neutral";
            default:
                return "neutral";
        }
    }, []);

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

    const columnHelper = useMemo(() => createColumnHelper<Issue>(), []);

    const isFieldFiltered = useCallback(
        (field: string) => filters.groups[0]?.conditions.some(c => c.field === field) ?? false,
        [filters]
    );

    const renderFilterHeader = useFilterHeader({
        sorting,
        isFieldFiltered,
        filterConfig,
        allConditions,
        currentLogic,
        applyConditions,
        removeFieldConditions,
        openFilter,
        setOpenFilter,
        bumpKey,
        popoverKeys
    });

    const columns = useMemo(
        () =>
            [
                createSelectColumn(columnHelper),
                columnHelper.accessor("title", {
                    header: renderFilterHeader(t("table.title"), "title"),
                    enableSorting: true
                }),
                columnHelper.accessor("projectName", {
                    header: renderFilterHeader(t("table.project"), "projectName"),
                    enableSorting: true
                }),
                columnHelper.accessor("status", {
                    header: renderFilterHeader(t("table.status"), "status"),
                    enableSorting: true,
                    cell: info => (
                        <Chip color={getStatusChipColor(info.getValue())}>
                            {statusLabels[info.getValue()] ?? info.getValue()}
                        </Chip>
                    )
                }),
                columnHelper.accessor("priority", {
                    header: renderFilterHeader(t("table.priority"), "priority"),
                    enableSorting: true,
                    cell: info => (
                        <Chip color={getPriorityChipColor(info.getValue())}>
                            {priorityLabels[info.getValue()] ?? info.getValue()}
                        </Chip>
                    )
                }),
                columnHelper.accessor("category", {
                    header: renderFilterHeader(t("table.category"), "category"),
                    enableSorting: true,
                    cell: info => t(`category.${info.getValue().toLowerCase()}`)
                }),
                columnHelper.accessor("assigneeLogin", {
                    header: renderFilterHeader(t("table.assignee"), "assigneeLogin"),
                    enableSorting: true,
                    cell: info => info.getValue() ?? "—"
                }),
                columnHelper.accessor((row: Issue) => row.createdAt, {
                    id: "createdAt",
                    header: renderFilterHeader(t("table.created"), "createdAt"),
                    enableSorting: true,
                    cell: info => formatDate(info.getValue())
                })
            ] as ColumnDef<Issue>[],
        [columnHelper, t, renderFilterHeader, statusLabels, priorityLabels, getStatusChipColor, getPriorityChipColor]
    );
    const sortBy = sorting[0]?.id;
    const sortOrder: "asc" | "desc" | undefined = sorting[0]?.desc ? "desc" : sorting[0] ? "asc" : undefined;
    const page = pageIndex + 1;

    const issueParams = useMemo(
        () =>
            ({
                page,
                perPage,
                ...(sortBy ? { sortBy } : {}),
                ...(sortOrder ? { sortOrder } : {}),
                ...(filterQueryString ? { filter: filterQueryString } : {})
            }) satisfies FetchIssuesParams,
        [page, perPage, sortBy, sortOrder, filterQueryString]
    );

    const { data, isPending, isError, error } = useQuery({
        queryKey: ["issues", issueParams],
        queryFn: () => fetchIssues(issueParams),
        enabled: ready,
        placeholderData: keepPreviousData,
        refetchInterval: 30000,
        structuralSharing: false
    });

    const issues = data?.issues ?? [];
    const total = data?.total ?? 0;
    const issuesRef = useRef(issues);
    if (issuesRef.current !== issues) {
        issuesRef.current = issues;
    }

    const handleSort = useCallback(
        (columnId: string) => {
            setSorting(prev => {
                const current = prev.find(s => s.id === columnId);
                if (!current) return [{ id: columnId, desc: false }];
                if (!current.desc) return [{ id: columnId, desc: true }];
                return [];
            });
        },
        [setSorting]
    );

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
        mutationFn: (id: number) => deleteIssue(id)
    });

    const handleDeleteSelected = async () => {
        if (!window.confirm(t("confirm.deleteSelected", { count: selectedCount }))) return;
        await Promise.all(selectedIds.map(id => deleteIssueMutate(id)));
        queryClient.invalidateQueries({ queryKey: ["issues"] });
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
                        <Button
                            className={styles["issues-page__export-btn"]}
                            type="button"
                            onClick={() => setExportOpen(true)}
                            startIcon={<ExportIcon />}
                        >
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

            {hasActiveFilters && (
                <FilterChips
                    conditions={filters.groups.flatMap(g => g.conditions)}
                    fieldConfigs={filterConfig.fields}
                    onRemove={conditionId => {
                        const groupIdx = filters.groups.findIndex(g => g.conditions.some(c => c.id === conditionId));
                        if (groupIdx !== -1) {
                            const condIdx = filters.groups[groupIdx]!.conditions.findIndex(c => c.id === conditionId);
                            removeCondition(groupIdx, condIdx);
                        }
                    }}
                    onClearAll={() => resetFilters()}
                />
            )}

            <div className={styles["issues-page__table-area"]} ref={containerRef}>
                {isPending && !data ? (
                    <p className={styles["issues-page__empty"]}>{t("loading")}</p>
                ) : (
                    <DataTable
                        table={table}
                        sorting={sorting}
                        onSort={handleSort}
                        onRowDoubleClick={row => navigate(`/tasks/${row.id}`)}
                        total={total}
                        className={styles["issues-page__table"]}
                    />
                )}
            </div>
            <ErrorModal
                isOpen={isError || !!errorMessage}
                message={errorMessage ?? (error instanceof Error ? error.message : t("error.loading"))}
                onClose={() => setErrorMessage(null)}
            />
            <ExportModal
                isOpen={exportOpen}
                onClose={() => setExportOpen(false)}
                onExport={() => {
                    setExportOpen(false);
                }}
                exportUrl="/api/export/issues"
                hasActiveFilters={hasActiveFilters}
                hasActiveSorting={sorting.length > 0}
                {...(hasActiveFilters
                    ? {
                          activeFiltersDescription: allConditions
                              .map(c => filterConfig.fields.find(f => f.field === c.field)?.label ?? c.field)
                              .join(", ")
                      }
                    : {})}
                {...(sorting.length > 0
                    ? {
                          activeSortingDescription: sorting
                              .map(s => {
                                  const sortLabelKey = s.id === "createdAt" ? "created" : s.id;
                                  const label = t(`table.${sortLabelKey}`);
                                  return `${label} ${s.desc ? "↓" : "↑"}`;
                              })
                              .join(", ")
                      }
                    : {})}
                {...(filterQueryString ? { filterQueryString } : {})}
                {...(sortBy ? { sortBy } : {})}
                {...(sortOrder ? { sortOrder } : {})}
                columnNamespace={ISSUES}
                availableLocales={["ru", "en"]}
                fileNamePrefix={{ ru: "Задачи", en: "Issues" }}
                columnLabelKeys={{
                    title: "table.title",
                    status: "table.status",
                    priority: "table.priority",
                    category: "table.category",
                    projectName: "table.project",
                    assigneeLogin: "table.assignee",
                    createdAt: "table.created"
                }}
            />
        </div>
    );
};
