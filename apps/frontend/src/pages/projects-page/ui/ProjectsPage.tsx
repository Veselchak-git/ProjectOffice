/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { PROJECTS } from "@helpdesk-portal/i18n";
import ExportIcon from "@helpdesk-portal/icons/Export.svg?react";
import PlusIcon from "@helpdesk-portal/icons/Plus.svg?react";
import { Button, Chip, Modal } from "@helpdesk-portal/ui-kit";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import type { CreateProjectData, FetchProjectsParams, Project } from "@/entities/project";
import { createProject, deleteProject, fetchProjects } from "@/entities/project";
import { ProjectForm } from "@/entities/project";

import { ErrorModal } from "@/shared/lib/error-boundary/ErrorModal";
import { formatDate } from "@/shared/lib/format-date";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { useTable } from "@/shared/lib/use-table";
import { useFilterState, usePopoverKeys } from "@/shared/lib/use-table-filter";
import type { FieldOption } from "@/shared/lib/use-table-filter/types";
import { useTablePage } from "@/shared/lib/use-table-page";

import { ColumnsDropdown } from "@/shared/ui/columns-dropdown";
import { ColumnHeader, DataTable, FilterChips, useFilterHeader } from "@/shared/ui/data-table";
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
} from "../model/projects-page-slice";
import styles from "./ProjectsPage.module.css";

export const ProjectsPage: FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(PROJECTS);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const filterConfig = useMemo<{ fields: FieldOption[] }>(
        () => ({
            fields: [
                { field: "name", label: t("filter.name"), type: "text" },
                {
                    field: "status",
                    label: t("filter.status"),
                    type: "enum",
                    enumValues: [
                        { value: "ACTIVE", label: t("filter.statusOptions.ACTIVE") },
                        { value: "ARCHIVED", label: t("filter.statusOptions.ARCHIVED") }
                    ]
                },
                { field: "responsible", label: t("filter.responsible"), type: "text" },
                { field: "createdAt", label: t("filter.createdAt"), type: "date" }
            ]
        }),
        [t]
    );
    const queryClient = useQueryClient();
    const dispatch = useAppDispatch();
    const columnVisibility = useAppSelector(selectColumnVisibility);
    const columnOrder = useAppSelector(selectColumnOrder);
    const rowSelection = useAppSelector(selectRowSelection);
    const [creating, setCreating] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);

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
    } = useFilterState("projects", filterConfig);

    const [openFilter, setOpenFilter] = useState<string | null>(null);
    const { popoverKeys, bumpKey } = usePopoverKeys();

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
        page: "projects",
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

    const columnHelper = useMemo(() => createColumnHelper<Project>(), []);

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
                columnHelper.accessor("name", {
                    header: renderFilterHeader(t("table.name"), "name"),
                    enableSorting: true
                }),
                columnHelper.accessor("description", {
                    header: t("table.description"),
                    enableSorting: false,
                    cell: info => info.getValue()
                }),
                columnHelper.accessor("status", {
                    header: renderFilterHeader(t("table.status"), "status"),
                    enableSorting: true,
                    cell: info => {
                        const status = info.getValue();
                        const chipColor = status === "ACTIVE" ? "green" : "neutral";
                        const label = status === "ACTIVE" ? t("status.active") : t("status.archived");
                        return <Chip color={chipColor}>{label}</Chip>;
                    }
                }),
                columnHelper.accessor("versions", {
                    header: ({ column }) => {
                        const sorted = sorting.find(s => s.id === column.id);
                        const sortState: "none" | "asc" | "desc" = sorted ? (sorted.desc ? "desc" : "asc") : "none";
                        return (
                            <ColumnHeader
                                title={t("table.versions")}
                                field="versions"
                                sortState={sortState}
                                isActiveFilter={false}
                            />
                        );
                    },
                    enableSorting: true,
                    cell: info => {
                        const versions = info.getValue() as { id: number; version: string }[];
                        if (versions.length === 0) return "-";
                        const first = versions[0]!;
                        return (
                            <>
                                {first.version}
                                {versions.length > 1 && (
                                    <span className={styles["projects-table__version-extra"]}>
                                        {" "}
                                        +{versions.length - 1}
                                    </span>
                                )}
                            </>
                        );
                    }
                }),
                columnHelper.accessor("taskCount", {
                    id: "tasks",
                    header: ({ column }) => {
                        const sorted = sorting.find(s => s.id === column.id);
                        const sortState: "none" | "asc" | "desc" = sorted ? (sorted.desc ? "desc" : "asc") : "none";
                        return (
                            <ColumnHeader
                                title={t("table.tasks")}
                                field="tasks"
                                sortState={sortState}
                                isActiveFilter={false}
                            />
                        );
                    },
                    enableSorting: true
                }),
                columnHelper.accessor("responsible", {
                    header: renderFilterHeader(t("table.responsible"), "responsible"),
                    enableSorting: true
                }),
                columnHelper.accessor("createdAt", {
                    header: renderFilterHeader(t("table.created"), "createdAt"),
                    enableSorting: true,
                    cell: info => formatDate(info.getValue())
                })
            ] as ColumnDef<Project>[],
        [columnHelper, t, renderFilterHeader, sorting]
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

    const sortBy =
        sorting[0]?.id === "tasks" ? "taskCount" : sorting[0]?.id === "versions" ? "versionCount" : sorting[0]?.id;
    const sortOrder: "asc" | "desc" | undefined = sorting[0]?.desc ? "desc" : sorting[0] ? "asc" : undefined;
    const page = pageIndex + 1;

    const projectParams = useMemo(
        () =>
            ({
                page,
                perPage,
                ...(sortBy ? { sortBy } : {}),
                ...(sortOrder ? { sortOrder } : {}),
                ...(filterQueryString ? { filter: filterQueryString } : {})
            }) satisfies FetchProjectsParams,
        [page, perPage, sortBy, sortOrder, filterQueryString]
    );

    const { data, isPending, isError, error } = useQuery({
        queryKey: ["projects", projectParams],
        queryFn: () => fetchProjects(projectParams),
        enabled: ready,
        placeholderData: keepPreviousData,
        refetchInterval: 30000,
        structuralSharing: false
    });

    const projects = data?.projects ?? [];
    const total = data?.total ?? 0;
    const active = data?.active ?? 0;

    const { table } = useTable({
        data: projects,
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

    const { mutateAsync: deleteProjectMutate } = useMutation({
        mutationFn: (id: number) => deleteProject(id),
        onError: e => setErrorMessage(e.message)
    });

    const handleDeleteSelected = async () => {
        if (!window.confirm(t("confirm.deleteSelected", { count: selectedCount }))) return;
        await Promise.all(selectedIds.map(id => deleteProjectMutate(id)));
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        dispatch(setRowSelection({}));
    };

    const { mutateAsync: createProjectMutate } = useMutation({
        mutationFn: (dto: CreateProjectData) => createProject(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["audit-log-available"] });
            setCreating(false);
        },
        onError: e => setErrorMessage(e.message)
    });

    return (
        <div className={styles["projects-page"]}>
            <PageHeader
                title={t("page.title")}
                subtitle={t("page.subtitle", { active, total })}
                actions={
                    <>
                        <Button
                            className={styles["projects-page__create-btn"]}
                            type="button"
                            onClick={() => setCreating(true)}
                            startIcon={<PlusIcon />}
                        >
                            {t("actions.create")}
                        </Button>
                        {selectedCount > 0 && (
                            <Button variant="stroke" color="error" size="m" onClick={handleDeleteSelected}>
                                {t("actions.deleteSelected", { count: selectedCount })}
                            </Button>
                        )}
                        <Button
                            className={styles["projects-page__export-btn"]}
                            type="button"
                            startIcon={<ExportIcon />}
                            onClick={() => setExportOpen(true)}
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

            <div className={styles["projects-page__table-area"]} ref={containerRef}>
                {isPending && !data ? (
                    <p className={styles["projects-page__empty"]}>{t("loading")}</p>
                ) : (
                    <DataTable
                        table={table}
                        sorting={sorting}
                        onSort={handleSort}
                        onRowDoubleClick={row => navigate(`/projects/${row.id}`)}
                        total={total}
                        className={styles["projects-page__table"]}
                    />
                )}
            </div>

            <Modal isOpen={creating} onClose={() => setCreating(false)} title={t("create.title")}>
                <ProjectForm
                    onSubmit={data => createProjectMutate(data as CreateProjectData).then(() => {})}
                    onCancel={() => setCreating(false)}
                />
            </Modal>
            <ExportModal
                isOpen={exportOpen}
                onClose={() => setExportOpen(false)}
                onExport={() => {
                    setExportOpen(false);
                }}
                exportUrl="/api/export/projects"
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
                                  const columnId = s.id === "tasks" ? "tasks" : s.id;
                                  const sortLabelKey = columnId === "createdAt" ? "created" : columnId;
                                  const label = t(`table.${sortLabelKey}`);
                                  return `${label} ${s.desc ? "↓" : "↑"}`;
                              })
                              .join(", ")
                      }
                    : {})}
                {...(filterQueryString ? { filterQueryString } : {})}
                {...(sortBy ? { sortBy } : {})}
                {...(sortOrder ? { sortOrder } : {})}
                columnNamespace={PROJECTS}
                availableLocales={["ru", "en"]}
                columnLabelKeys={{
                    name: "table.name",
                    description: "table.description",
                    status: "table.status",
                    versions: "table.versions",
                    tasks: "table.tasks",
                    responsible: "table.responsible",
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
