import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ExportIcon from "@helpdesk-portal/icons/Export.svg?react";
import GearIcon from "@helpdesk-portal/icons/GearIcon.svg?react";
import PlusIcon from "@helpdesk-portal/icons/Plus.svg?react";
import { Checkbox } from "@helpdesk-portal/ui-kit";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    type OnChangeFn,
    type PaginationState,
    type SortingState,
    createColumnHelper,
    getCoreRowModel,
    useReactTable
} from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router";

import { rootReducer } from "@/app/store";

import type { CreateProjectData, FetchProjectsParams, Project } from "@/entities/project";
import { createProject, fetchProjects } from "@/entities/project";
import { ProjectForm } from "@/entities/project";

import { useAuth } from "@/shared/lib/auth";
import { formatDate } from "@/shared/lib/format-date";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { useDynamicPerPage } from "@/shared/lib/use-dynamic-per-page";

import { DataTable, DataTablePagination } from "@/shared/components/data-table";

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
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const dispatch = useAppDispatch();
    const columnVisibility = useAppSelector(selectColumnVisibility);
    const columnOrder = useAppSelector(selectColumnOrder);
    const rowSelection = useAppSelector(selectRowSelection);
    const [paginationState, setPaginationState] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [creating, setCreating] = useState(false);
    const [columnsOpen, setColumnsOpen] = useState(false);
    const columnsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
                setColumnsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const containerRef = useRef<HTMLDivElement>(null);
    const { perPage, ready } = useDynamicPerPage(containerRef, {
        rowHeight: 57,
        theadHeight: 41,
        paginationHeight: 36,
        min: 5
    });

    const pagination = useMemo<PaginationState>(() => {
        if (perPage === paginationState.pageSize) return paginationState;
        const oldOffset = paginationState.pageIndex * paginationState.pageSize;
        const newPageIndex = Math.floor(oldOffset / perPage);
        return { pageIndex: newPageIndex, pageSize: perPage };
    }, [paginationState, perPage]);

    const sortBy = sorting[0]?.id === "tasks" ? "taskCount" : sorting[0]?.id;
    const sortOrder: "asc" | "desc" | undefined = sorting[0]?.desc ? "desc" : sorting[0] ? "asc" : undefined;
    const page = pagination.pageIndex + 1;

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

    const { mutateAsync: createProjectMutate } = useMutation({
        mutationFn: (dto: CreateProjectData) => createProject(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["audit-log-available"] });
            setCreating(false);
        }
    });

    const handleSortingChange: OnChangeFn<SortingState> = updater => {
        setSorting(updater);
        setPaginationState(prev => ({ ...prev, pageIndex: 0 }));
    };

    const columns = [
        columnHelper.display({
            id: "select",
            size: 48,
            enableSorting: false,
            enableHiding: false,
            header: ({ table }) => (
                <Checkbox
                    inputSize="m"
                    checked={table.getIsAllRowsSelected()}
                    indeterminate={table.getIsSomeRowsSelected()}
                    onCheckedChange={checked => table.toggleAllRowsSelected(checked)}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    inputSize="m"
                    checked={row.getIsSelected()}
                    onCheckedChange={row.getToggleSelectedHandler()}
                />
            )
        }),
        columnHelper.accessor("name", {
            header: "НАЗВАНИЕ",
            enableSorting: true,
            cell: info => info.getValue()
        }),
        columnHelper.accessor("description", {
            header: "ОПИСАНИЕ",
            enableSorting: false,
            cell: info => info.getValue()
        }),
        columnHelper.accessor("status", {
            header: "СТАТУС",
            enableSorting: true,
            cell: info => <StatusBadge status={info.getValue()} />
        }),
        columnHelper.accessor("versions", {
            header: "ВЕРСИИ",
            enableSorting: false,
            cell: info => info.getValue()[0] ?? "-"
        }),
        columnHelper.accessor("taskCount", {
            id: "tasks",
            header: "ЗАДАЧИ",
            enableSorting: true
        }),
        columnHelper.accessor("responsible", {
            header: "ОТВЕТСТВЕННЫЙ",
            enableSorting: false
        }),
        columnHelper.accessor("createdAt", {
            id: "created",
            header: "СОЗДАН",
            enableSorting: true,
            cell: info => formatDate(info.getValue())
        })
    ];

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const prev = columnOrder;
        const oldIndex = prev.indexOf(String(active.id));
        const newIndex = prev.indexOf(String(over.id));
        if (oldIndex === -1 || newIndex === -1) return;

        const next = [...prev];
        next.splice(newIndex, 0, ...next.splice(oldIndex, 1));
        dispatch(setColumnOrder(next));
    }

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: projects,
        columns,
        state: {
            columnOrder,
            pagination,
            sorting,
            columnVisibility,
            rowSelection
        },
        onPaginationChange: updater => {
            setPaginationState(prev => {
                const next = typeof updater === "function" ? updater(prev) : updater;
                return { pageIndex: next.pageIndex, pageSize: perPage };
            });
        },
        onSortingChange: handleSortingChange,
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
        getRowId: row => String(row.id),
        manualPagination: true,
        pageCount: perPage > 0 ? Math.ceil(total / perPage) : -1,
        manualSorting: true,
        getCoreRowModel: getCoreRowModel(),
        enableRowSelection: true
    });

    return (
        <div className="projects-page">
            <div className="projects-page__title-area">
                <div className="projects-page__title-text">
                    <h1 className="projects-page__title-heading">Проекты</h1>
                    <p className="projects-page__title-subtitle">
                        Все проекты, доступные в Вашей роли — {active} активных из {total}
                    </p>
                </div>
                <div className="projects-page__actions">
                    {user?.role !== "GUEST" && (
                        <button className="projects-page__create-btn" type="button" onClick={() => setCreating(true)}>
                            <PlusIcon />
                            Создать проект
                        </button>
                    )}
                    <button className="projects-page__export-btn" type="button">
                        <ExportIcon />
                        Экспорт
                    </button>
                    <div className="projects-page__columns-wrapper" ref={columnsRef}>
                        <button
                            className="projects-page__columns-btn"
                            type="button"
                            onClick={() => setColumnsOpen(v => !v)}
                        >
                            <GearIcon />
                            Колонки
                        </button>
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
                                                        label={col.label}
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
                    <p className="projects-page__empty">Загрузка проектов…</p>
                ) : isError && !data ? (
                    <p className="projects-page__empty">{error instanceof Error ? error.message : "Ошибка загрузки"}</p>
                ) : (
                    <DataTable table={table} onRowDoubleClick={row => navigate(`/projects/${row.id}`)}>
                        <DataTablePagination table={table} total={total} />
                    </DataTable>
                )}
            </div>

            {creating && (
                <div className="projects-page__overlay">
                    <div className="projects-page__modal">
                        <h2 className="projects-page__modal-title">Создание проекта</h2>
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

const GripIcon: FC = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="4" r="1.5" />
        <circle cx="11" cy="4" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="11" cy="12" r="1.5" />
    </svg>
);

const SortableColumnItem: FC<{
    id: string;
    label: string;
    isVisible: boolean;
    onToggle: () => void;
}> = ({ id, label, isVisible, onToggle }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`projects-page__columns-option${isDragging ? " projects-page__columns-option--dragging" : ""}`}
        >
            <button className="projects-page__columns-drag-btn" type="button" {...attributes} {...listeners}>
                <GripIcon />
            </button>
            <Checkbox inputSize="m" checked={isVisible} onCheckedChange={onToggle} />
            <span className="projects-page__columns-label" onClick={onToggle}>
                {label}
            </span>
        </div>
    );
};

const StatusBadge: FC<{ status: Project["status"] }> = ({ status }) => {
    const isActive = status === "ACTIVE";

    return (
        <span
            className={`projects-table__status-badge projects-table__status-badge--${isActive ? "active" : "archived"}`}
        >
            <span
                className={`projects-table__status-dot projects-table__status-dot--${isActive ? "active" : "archived"}`}
            />
            {isActive ? "Активный" : "Архивный"}
        </span>
    );
};
