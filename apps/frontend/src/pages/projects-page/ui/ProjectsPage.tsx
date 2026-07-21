/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PROJECTS } from "@helpdesk-portal/i18n";
import ExportIcon from "@helpdesk-portal/icons/Export.svg?react";
import GearIcon from "@helpdesk-portal/icons/GearIcon.svg?react";
import PlusIcon from "@helpdesk-portal/icons/Plus.svg?react";
import { Button } from "@helpdesk-portal/ui-kit";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef, type SortingState, createColumnHelper } from "@tanstack/react-table";
import { useRef, useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { rootReducer } from "@/app/store";

import type { CreateProjectData, FetchProjectsParams, Project } from "@/entities/project";
import { createProject, deleteProject, fetchProjects } from "@/entities/project";
import { ProjectForm } from "@/entities/project";

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
    projectsPageSlice,
    selectColumnOrder,
    selectColumnVisibility,
    selectRowSelection,
    setColumnOrder,
    setColumnVisibility,
    setRowSelection
} from "../model/projects-page-slice";
import "./ProjectsPage.css";

rootReducer.inject(projectsPageSlice);

const columnHelper = createColumnHelper<Project>();

export const ProjectsPage: FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(PROJECTS);
    const queryClient = useQueryClient();
    const dispatch = useAppDispatch();
    const columnVisibility = useAppSelector(selectColumnVisibility);
    const columnOrder = useAppSelector(selectColumnOrder);
    const rowSelection = useAppSelector(selectRowSelection);
    const [pageIndex, setPageIndex] = useState(0);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [creating, setCreating] = useState(false);
    const [columnsOpen, setColumnsOpen] = useState(false);
    const columnsRef = useRef<HTMLDivElement>(null);

    useClickOutside(columnsRef, () => setColumnsOpen(false));

    const containerRef = useRef<HTMLDivElement>(null);
    const { perPage, ready } = useDynamicPerPage(containerRef, {
        rowHeight: 48,
        theadHeight: 36,
        paginationHeight: 34,
        min: 5
    });

    const sortBy = sorting[0]?.id === "tasks" ? "taskCount" : sorting[0]?.id;
    const sortOrder: "asc" | "desc" | undefined = sorting[0]?.desc ? "desc" : sorting[0] ? "asc" : undefined;
    const page = pageIndex + 1;

    const projectParams = {
        page,
        perPage,
        ...(sortBy ? { sortBy } : {}),
        ...(sortOrder ? { sortOrder } : {})
    } satisfies FetchProjectsParams;

    const { data, isPending, isError, error } = useQuery({
        queryKey: ["projects", projectParams],
        queryFn: () => fetchProjects(projectParams),
        enabled: ready,
        placeholderData: keepPreviousData
    });

    const projects = data?.projects ?? [];
    const total = data?.total ?? 0;
    const active = data?.active ?? 0;

    const selectedIds = Object.keys(rowSelection).map(Number);
    const selectedCount = selectedIds.length;

    const { mutateAsync: deleteProjectMutate } = useMutation({
        mutationFn: (id: number) => deleteProject(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
    });

    const handleDeleteSelected = async () => {
        if (!window.confirm(t("confirm.deleteSelected", { count: selectedCount }))) return;
        await Promise.all(selectedIds.map(id => deleteProjectMutate(id)));
        dispatch(setRowSelection({}));
    };

    const { mutateAsync: createProjectMutate } = useMutation({
        mutationFn: (dto: CreateProjectData) => createProject(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["audit-log-available"] });
            setCreating(false);
        }
    });

    const columns = [
        createSelectColumn(columnHelper),
        columnHelper.accessor("name", {
            header: t("table.name"),
            enableSorting: true,
            cell: info => info.getValue()
        }),
        columnHelper.accessor("description", {
            header: t("table.description"),
            enableSorting: false,
            cell: info => info.getValue()
        }),
        columnHelper.accessor("status", {
            header: t("table.status"),
            enableSorting: true,
            cell: info => <StatusBadge status={info.getValue()} />
        }),
        columnHelper.accessor("versions", {
            header: t("table.versions"),
            enableSorting: false,
            cell: info => {
                const versions = info.getValue() as { id: number; version: string }[];
                if (versions.length === 0) return "-";
                const first = versions[0]!;
                return (
                    <>
                        {first.version}
                        {versions.length > 1 && (
                            <span className="projects-table__version-extra"> +{versions.length - 1}</span>
                        )}
                    </>
                );
            }
        }),
        columnHelper.accessor("taskCount", {
            id: "tasks",
            header: t("table.tasks"),
            enableSorting: true
        }),
        columnHelper.accessor("responsible", {
            header: t("table.responsible"),
            enableSorting: false
        }),
        createDateColumn(columnHelper, t)
    ];

    function handleDragEnd(event: DragEndEvent) {
        reorderColumn(event, columnOrder, next => dispatch(setColumnOrder(next)));
    }

    const { table } = useTable({
        data: projects,
        columns: columns as ColumnDef<Project>[],
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
        enableRowSelection: true
    });

    usePersistColumnSettings({
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

    return (
        <div className="projects-page">
            <div className="projects-page__title-area">
                <div className="projects-page__title-text">
                    <h1 className="projects-page__title-heading">{t("page.title")}</h1>
                    <p className="projects-page__title-subtitle">{t("page.subtitle", { active, total })}</p>
                </div>
                <div className="projects-page__actions">
                    <Button
                        className="projects-page__create-btn"
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
                    <Button className="projects-page__export-btn" type="button" startIcon={<ExportIcon />}>
                        {t("actions.export")}
                    </Button>
                    <div className="projects-page__columns-wrapper" ref={columnsRef}>
                        <Button
                            className="projects-page__columns-btn"
                            type="button"
                            onClick={() => setColumnsOpen(v => !v)}
                            startIcon={<GearIcon />}
                        >
                            {t("actions.columns")}
                        </Button>
                        {columnsOpen && (
                            <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                                <SortableContext items={columnOrder} strategy={verticalListSortingStrategy}>
                                    <div className="projects-page__columns-dropdown">
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

            <div className="projects-page__table-area" ref={containerRef}>
                {isPending && !data ? (
                    <p className="projects-page__empty">{t("loading")}</p>
                ) : isError && !data ? (
                    <p className="projects-page__empty">
                        {error instanceof Error ? error.message : t("error.loading")}
                    </p>
                ) : (
                    <DataTable table={table} onRowDoubleClick={row => navigate(`/projects/${row.id}`)} total={total} />
                )}
            </div>

            {creating && (
                <div className="projects-page__overlay">
                    <div className="projects-page__modal">
                        <h2 className="projects-page__modal-title">{t("create.title")}</h2>
                        <ProjectForm
                            onSubmit={data => createProjectMutate(data as CreateProjectData).then(() => {})}
                            onCancel={() => setCreating(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusBadge: FC<{ status: Project["status"] }> = ({ status }) => {
    const { t } = useTranslation(PROJECTS);
    const isActive = status === "ACTIVE";

    return (
        <span
            className={`projects-table__status-badge projects-table__status-badge--${isActive ? "active" : "archived"}`}
        >
            <span
                className={`projects-table__status-dot projects-table__status-dot--${isActive ? "active" : "archived"}`}
            />
            {isActive ? t("status.active") : t("status.archived")}
        </span>
    );
};
