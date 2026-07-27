/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { AUDIT } from "@helpdesk-portal/i18n";
import ExportIcon from "@helpdesk-portal/icons/Export.svg?react";
import { Button, Chip } from "@helpdesk-portal/ui-kit";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import { useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import type { AuditLog, FetchAuditLogsParams } from "@/entities/audit-log";
import { fetchAuditLogs } from "@/entities/audit-log";

import { ErrorModal } from "@/shared/lib/error-boundary/ErrorModal";
import { formatDate } from "@/shared/lib/format-date";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { useRealtimeEvents } from "@/shared/lib/sse";
import { useTable } from "@/shared/lib/use-table";
import { useFilterState, usePopoverKeys } from "@/shared/lib/use-table-filter";
import type { FieldOption } from "@/shared/lib/use-table-filter/types";
import { useTablePage } from "@/shared/lib/use-table-page";

import { ColumnsDropdown } from "@/shared/ui/columns-dropdown";
import { ColumnHeader, DataTable, FilterChips, FilterPopover } from "@/shared/ui/data-table";
import { ExportModal } from "@/shared/ui/export-modal";
import { PageHeader } from "@/shared/ui/page-header";

import {
    selectColumnOrder,
    selectColumnVisibility,
    setColumnOrder,
    setColumnVisibility
} from "../model/audit-log-page-slice";
import { ALL_COLUMNS } from "../model/columns";
import { AuditLogDetailModal } from "./AuditLogDetailModal";
import styles from "./AuditLogPage.module.css";

export const AuditLogPage: FC = () => {
    const { t } = useTranslation(AUDIT);
    const dispatch = useAppDispatch();
    const columnVisibility = useAppSelector(selectColumnVisibility);
    const columnOrder = useAppSelector(selectColumnOrder);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [openFilter, setOpenFilter] = useState<string | null>(null);
    const [exportOpen, setExportOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { popoverKeys, bumpKey } = usePopoverKeys();

    const filterConfig = useMemo<{ fields: FieldOption[] }>(
        () => ({
            fields: [
                {
                    field: "eventType",
                    label: t("filter.eventType"),
                    type: "enum",
                    enumValues: [
                        { value: "ADDED", label: t("filter.events.ADDED") },
                        { value: "CREATED", label: t("filter.events.CREATED") },
                        { value: "UPDATED", label: t("filter.events.UPDATED") },
                        { value: "DELETED", label: t("filter.events.DELETED") }
                    ]
                },
                {
                    field: "subjectType",
                    label: t("filter.subjectType"),
                    type: "enum",
                    enumValues: [{ value: "USER", label: t("filter.subjects.USER") }]
                },
                {
                    field: "objectType",
                    label: t("filter.objectType"),
                    type: "enum",
                    enumValues: [
                        { value: "ISSUE", label: t("filter.objects.ISSUE") },
                        { value: "PROJECT", label: t("filter.objects.PROJECT") },
                        { value: "USER", label: t("filter.objects.USER") },
                        { value: "AUDIT_LOG", label: t("filter.objects.AUDIT_LOG") }
                    ]
                },
                { field: "subjectId", label: t("filter.subjectId"), type: "text" },
                { field: "objectId", label: t("filter.objectId"), type: "text" },
                { field: "createdAt", label: t("filter.createdAt"), type: "date" }
            ]
        }),
        [t]
    );

    const filterState = useFilterState("audit-log", filterConfig);
    const {
        filters,
        setFilters,
        applyFilters,
        resetFilters,
        hasActiveFilters,
        filterQueryString,
        allConditions,
        currentLogic,
        applyConditions,
        removeFieldConditions
    } = filterState;

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
        page: "audit-log",
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

    const isFieldFiltered = useCallback(
        (field: string) => filters.groups.some(g => g.conditions.some(c => c.field === field)),
        [filters]
    );

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

    const handleRemoveFilterCondition = useCallback(
        (conditionId: string) => {
            const groupIdx = filters.groups.findIndex(g => g.conditions.some(c => c.id === conditionId));
            if (groupIdx === -1) return;
            const condIdx = filters.groups[groupIdx]!.conditions.findIndex(c => c.id === conditionId);
            const group = filters.groups[groupIdx];
            if (!group) return;
            const newConditions = group.conditions.filter((_, i) => i !== condIdx);
            const newGroups = [...filters.groups];
            newGroups[groupIdx] = { ...group, conditions: newConditions };
            const nextState = { ...filters, groups: newGroups };
            setFilters(nextState);
            applyFilters(nextState);
        },
        [filters, setFilters, applyFilters]
    );

    const columnHelper = useMemo(() => createColumnHelper<AuditLog>(), []);

    const eventTypeLabels = useMemo<Record<string, string>>(
        () => ({
            USER_CREATED: t("eventType.USER_CREATED"),
            USER_UPDATED: t("eventType.USER_UPDATED"),
            USER_DELETED: t("eventType.USER_DELETED"),
            ISSUE_CREATED: t("eventType.ISSUE_CREATED"),
            ISSUE_UPDATED: t("eventType.ISSUE_UPDATED"),
            ISSUE_DELETED: t("eventType.ISSUE_DELETED"),
            PROJECT_CREATED: t("eventType.PROJECT_CREATED"),
            PROJECT_UPDATED: t("eventType.PROJECT_UPDATED"),
            PROJECT_DELETED: t("eventType.PROJECT_DELETED"),
            MEMBER_ADDED: t("eventType.MEMBER_ADDED"),
            MEMBER_UPDATED: t("eventType.MEMBER_UPDATED"),
            MEMBER_REMOVED: t("eventType.MEMBER_REMOVED"),
            CREATE: t("eventType.CREATE"),
            UPDATE: t("eventType.UPDATE"),
            DELETE: t("eventType.DELETE")
        }),
        [t]
    );

    const subjectTypeLabels = useMemo<Record<string, string>>(
        () => ({
            USER: t("subjectType.USER")
        }),
        [t]
    );

    const objectTypeLabels = useMemo<Record<string, string>>(
        () => ({
            ISSUE: t("objectType.ISSUE"),
            PROJECT: t("objectType.PROJECT"),
            USER: t("objectType.USER"),
            AUDIT_LOG: t("objectType.AUDIT_LOG")
        }),
        [t]
    );

    const columns = useMemo(
        () =>
            [
                columnHelper.accessor("eventType", {
                    header: ({ column }) => {
                        const sorted = sorting.find(s => s.id === column.id);
                        const sortState: "none" | "asc" | "desc" = sorted ? (sorted.desc ? "desc" : "asc") : "none";
                        return (
                            <ColumnHeader
                                title={t("table.eventType")}
                                field="eventType"
                                sortState={sortState}
                                isActiveFilter={isFieldFiltered("eventType")}
                                onFilterClick={f => {
                                    setOpenFilter(f);
                                    bumpKey(f);
                                }}
                            >
                                <FilterPopover
                                    key={`eventType-popover-${popoverKeys["eventType"] ?? 0}`}
                                    fields={filterConfig.fields}
                                    conditions={allConditions}
                                    logic={currentLogic}
                                    initialField="eventType"
                                    onApply={(conditions, logic) => applyConditions(conditions, logic)}
                                    onReset={() => removeFieldConditions("eventType")}
                                    isOpen={openFilter === "eventType"}
                                    onClose={() => setOpenFilter(null)}
                                />
                            </ColumnHeader>
                        );
                    },
                    enableSorting: true,
                    cell: info => {
                        const v = info.getValue();
                        const chipColor =
                            v.includes("CREATED") || v.includes("ADDED")
                                ? "green"
                                : v.includes("DELETED") || v.includes("REMOVED")
                                  ? "red"
                                  : "orange";
                        return <Chip color={chipColor}>{eventTypeLabels[v] ?? v}</Chip>;
                    }
                }),
                columnHelper.accessor("subjectType", {
                    header: ({ column }) => {
                        const sorted = sorting.find(s => s.id === column.id);
                        const sortState: "none" | "asc" | "desc" = sorted ? (sorted.desc ? "desc" : "asc") : "none";
                        return (
                            <ColumnHeader
                                title={t("table.subjectType")}
                                field="subjectType"
                                sortState={sortState}
                                isActiveFilter={isFieldFiltered("subjectType")}
                                onFilterClick={f => {
                                    setOpenFilter(f);
                                    bumpKey(f);
                                }}
                            >
                                <FilterPopover
                                    key={`subjectType-popover-${popoverKeys["subjectType"] ?? 0}`}
                                    fields={filterConfig.fields}
                                    conditions={allConditions}
                                    logic={currentLogic}
                                    initialField="subjectType"
                                    onApply={(conditions, logic) => applyConditions(conditions, logic)}
                                    onReset={() => removeFieldConditions("subjectType")}
                                    isOpen={openFilter === "subjectType"}
                                    onClose={() => setOpenFilter(null)}
                                />
                            </ColumnHeader>
                        );
                    },
                    enableSorting: true,
                    cell: info => subjectTypeLabels[info.getValue()] ?? info.getValue()
                }),
                columnHelper.accessor("objectType", {
                    header: ({ column }) => {
                        const sorted = sorting.find(s => s.id === column.id);
                        const sortState: "none" | "asc" | "desc" = sorted ? (sorted.desc ? "desc" : "asc") : "none";
                        return (
                            <ColumnHeader
                                title={t("table.objectType")}
                                field="objectType"
                                sortState={sortState}
                                isActiveFilter={isFieldFiltered("objectType")}
                                onFilterClick={f => {
                                    setOpenFilter(f);
                                    bumpKey(f);
                                }}
                            >
                                <FilterPopover
                                    key={`objectType-popover-${popoverKeys["objectType"] ?? 0}`}
                                    fields={filterConfig.fields}
                                    conditions={allConditions}
                                    logic={currentLogic}
                                    initialField="objectType"
                                    onApply={(conditions, logic) => applyConditions(conditions, logic)}
                                    onReset={() => removeFieldConditions("objectType")}
                                    isOpen={openFilter === "objectType"}
                                    onClose={() => setOpenFilter(null)}
                                />
                            </ColumnHeader>
                        );
                    },
                    enableSorting: true,
                    cell: info => objectTypeLabels[info.getValue()] ?? info.getValue()
                }),
                columnHelper.accessor("subjectId", {
                    header: ({ column }) => {
                        const sorted = sorting.find(s => s.id === column.id);
                        const sortState: "none" | "asc" | "desc" = sorted ? (sorted.desc ? "desc" : "asc") : "none";
                        return (
                            <ColumnHeader
                                title={t("table.subjectId")}
                                field="subjectId"
                                sortState={sortState}
                                isActiveFilter={isFieldFiltered("subjectId")}
                                onFilterClick={f => {
                                    setOpenFilter(f);
                                    bumpKey(f);
                                }}
                            >
                                <FilterPopover
                                    key={`subjectId-popover-${popoverKeys["subjectId"] ?? 0}`}
                                    fields={filterConfig.fields}
                                    conditions={allConditions}
                                    logic={currentLogic}
                                    initialField="subjectId"
                                    onApply={(conditions, logic) => applyConditions(conditions, logic)}
                                    onReset={() => removeFieldConditions("subjectId")}
                                    isOpen={openFilter === "subjectId"}
                                    onClose={() => setOpenFilter(null)}
                                />
                            </ColumnHeader>
                        );
                    },
                    enableSorting: true
                }),
                columnHelper.accessor("objectId", {
                    header: ({ column }) => {
                        const sorted = sorting.find(s => s.id === column.id);
                        const sortState: "none" | "asc" | "desc" = sorted ? (sorted.desc ? "desc" : "asc") : "none";
                        return (
                            <ColumnHeader
                                title={t("table.objectId")}
                                field="objectId"
                                sortState={sortState}
                                isActiveFilter={isFieldFiltered("objectId")}
                                onFilterClick={f => {
                                    setOpenFilter(f);
                                    bumpKey(f);
                                }}
                            >
                                <FilterPopover
                                    key={`objectId-popover-${popoverKeys["objectId"] ?? 0}`}
                                    fields={filterConfig.fields}
                                    conditions={allConditions}
                                    logic={currentLogic}
                                    initialField="objectId"
                                    onApply={(conditions, logic) => applyConditions(conditions, logic)}
                                    onReset={() => removeFieldConditions("objectId")}
                                    isOpen={openFilter === "objectId"}
                                    onClose={() => setOpenFilter(null)}
                                />
                            </ColumnHeader>
                        );
                    },
                    enableSorting: true
                }),
                columnHelper.accessor((row: AuditLog) => row.createdAt, {
                    id: "createdAt",
                    header: ({ column }) => {
                        const sorted = sorting.find(s => s.id === column.id);
                        const sortState: "none" | "asc" | "desc" = sorted ? (sorted.desc ? "desc" : "asc") : "none";
                        return (
                            <ColumnHeader
                                title={t("table.created")}
                                field="createdAt"
                                sortState={sortState}
                                isActiveFilter={isFieldFiltered("createdAt")}
                                onFilterClick={f => {
                                    setOpenFilter(f);
                                    bumpKey(f);
                                }}
                            >
                                <FilterPopover
                                    key={`createdAt-popover-${popoverKeys["createdAt"] ?? 0}`}
                                    fields={filterConfig.fields}
                                    conditions={allConditions}
                                    logic={currentLogic}
                                    initialField="createdAt"
                                    onApply={(conditions, logic) => applyConditions(conditions, logic)}
                                    onReset={() => removeFieldConditions("createdAt")}
                                    isOpen={openFilter === "createdAt"}
                                    onClose={() => setOpenFilter(null)}
                                />
                            </ColumnHeader>
                        );
                    },
                    enableSorting: true,
                    cell: info => formatDate(info.getValue())
                })
            ] as ColumnDef<AuditLog>[],
        [
            columnHelper,
            t,
            sorting,
            filterConfig,
            isFieldFiltered,
            allConditions,
            currentLogic,
            applyConditions,
            removeFieldConditions,
            openFilter,
            setOpenFilter,
            bumpKey,
            popoverKeys,
            eventTypeLabels,
            subjectTypeLabels,
            objectTypeLabels
        ]
    );

    const sortBy = sorting[0]?.id;
    const sortOrder: "asc" | "desc" | undefined = sorting[0]?.desc ? "desc" : sorting[0] ? "asc" : undefined;
    const page = pageIndex + 1;

    const auditLogParams = useMemo(
        () =>
            ({
                page,
                perPage,
                ...(sortBy ? { sortBy } : {}),
                ...(sortOrder ? { sortOrder } : {}),
                ...(filterQueryString ? { filter: filterQueryString } : {})
            }) satisfies FetchAuditLogsParams,
        [page, perPage, sortBy, sortOrder, filterQueryString]
    );

    useRealtimeEvents({ "audit-log": ["audit-logs"] });

    const { data, isPending, isError, error } = useQuery({
        queryKey: ["audit-logs", auditLogParams],
        queryFn: () => fetchAuditLogs(auditLogParams),
        enabled: ready,
        placeholderData: keepPreviousData
    });

    const logs = data?.logs ?? [];
    const total = data?.total ?? 0;

    const { table } = useTable({
        data: logs,
        columns: columns as ColumnDef<AuditLog>[],
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
        }
    });

    return (
        <div className={styles["audit-log-page"]}>
            <PageHeader
                title={t("page.title")}
                subtitle={t("page.subtitle", { total })}
                actions={
                    <>
                        <Button
                            className={styles["audit-log-page__export-btn"]}
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
                        />
                    </>
                }
            />

            {hasActiveFilters && (
                <FilterChips
                    conditions={filters.groups.flatMap(g => g.conditions)}
                    fieldConfigs={filterConfig.fields}
                    onRemove={handleRemoveFilterCondition}
                    onClearAll={resetFilters}
                />
            )}

            <div className={styles["audit-log-page__table-area"]} ref={containerRef}>
                {isPending && !data ? (
                    <p className={styles["audit-log-page__empty"]}>{t("loading")}</p>
                ) : (
                    <DataTable
                        table={table}
                        total={total}
                        sorting={sorting}
                        onSort={handleSort}
                        className={styles["audit-log-page__table"]}
                        onRowDoubleClick={log => {
                            if (log.oldValue != null || log.newValue != null) {
                                setSelectedLog(log);
                            }
                        }}
                    />
                )}
            </div>

            {selectedLog && <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

            <ExportModal
                isOpen={exportOpen}
                onClose={() => setExportOpen(false)}
                onExport={() => {
                    setExportOpen(false);
                }}
                exportUrl="/api/export/audit-log"
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
                                  const label = t(`table.${s.id === "createdAt" ? "created" : s.id}`);
                                  return `${label} ${s.desc ? "↓" : "↑"}`;
                              })
                              .join(", ")
                      }
                    : {})}
                {...(filterQueryString ? { filterQueryString } : {})}
                {...(sortBy ? { sortBy } : {})}
                {...(sortOrder ? { sortOrder } : {})}
                columnNamespace={AUDIT}
                availableLocales={["ru", "en"]}
                columnLabelKeys={{
                    eventType: "table.eventType",
                    subjectType: "table.subjectType",
                    objectType: "table.objectType",
                    subjectId: "table.subjectId",
                    objectId: "table.objectId",
                    createdAt: "table.created"
                }}
            />

            <ErrorModal
                isOpen={!!errorMessage || (isError && !isPending)}
                message={errorMessage ?? (error instanceof Error ? error.message : t("error.loading"))}
                onClose={() => setErrorMessage(null)}
            />
        </div>
    );
};
