import { Checkbox, Input } from "@helpdesk-portal/ui-kit";
import ExportIcon from "@helpdesk-portal/icons/Export.svg?react";
import GearIcon from "@helpdesk-portal/icons/GearIcon.svg?react";
import PlusIcon from "@helpdesk-portal/icons/Plus.svg?react";
import SearchIcon from "@helpdesk-portal/icons/Search.svg?react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router";
import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    type OnChangeFn,
    type PaginationState,
    type SortingState,
} from "@tanstack/react-table";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DataTable, DataTablePagination } from "@/shared/components/data-table";
import { useAuth } from "@/shared/lib/auth";
import { formatDate } from "@/shared/lib/format-date";
import { useDynamicPerPage } from "@/shared/lib/use-dynamic-per-page";

import type { CreateProjectData, FetchProjectsParams, Project } from "@/entities/project";
import { createProject, fetchProjects } from "@/entities/project";
import { ProjectForm } from "@/entities/project";

import "./ProjectsPage.css";

const ALL_COLUMNS = [
    { id: "name", label: "НАЗВАНИЕ" },
    { id: "description", label: "ОПИСАНИЕ" },
    { id: "status", label: "СТАТУС" },
    { id: "versions", label: "ВЕРСИИ" },
    { id: "tasks", label: "ЗАДАЧИ" },
    { id: "responsible", label: "ОТВЕТСТВЕННЫЙ" },
    { id: "created", label: "СОЗДАН" },
];

const columnHelper = createColumnHelper<Project>();

export const ProjectsPage: FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [paginationState, setPaginationState] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [searchInput, setSearchInput] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
        Object.fromEntries(ALL_COLUMNS.map(col => [col.id, true])),
    );
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
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

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQ(searchInput), 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setPaginationState(prev => ({ ...prev, pageIndex: 0 }));
    }, [debouncedQ]);

    const containerRef = useRef<HTMLDivElement>(null);
    const { perPage, ready } = useDynamicPerPage(containerRef, {
        rowHeight: 57,
        theadHeight: 41,
        paginationHeight: 36,
        min: 5,
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
        ...(debouncedQ ? { q: debouncedQ } : {}),
        page,
        perPage,
        ...(sortBy ? { sortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
    } satisfies FetchProjectsParams;

    const { data, isPending, isError, error } = useQuery({
        queryKey: ["projects", projectParams],
        queryFn: () => fetchProjects(projectParams),
        enabled: ready,
        placeholderData: keepPreviousData,
    });

    const projects = data?.projects ?? [];
    const total = data?.total ?? 0;
    const active = data?.active ?? 0;

    const { mutateAsync: createProjectMutate } = useMutation({
        mutationFn: (dto: CreateProjectData) => createProject(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setCreating(false);
        },
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
                    onCheckedChange={table.getToggleAllRowsSelectedHandler()}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    inputSize="m"
                    checked={row.getIsSelected()}
                    onCheckedChange={row.getToggleSelectedHandler()}
                />
            ),
        }),
        columnHelper.accessor("name", {
            header: "НАЗВАНИЕ",
            enableSorting: true,
            cell: info => (
                <button
                    className="projects-table__name-link"
                    type="button"
                    onClick={() => navigate(`/projects/${info.row.original.id}`)}
                >
                    {info.getValue()}
                </button>
            ),
        }),
        columnHelper.accessor("description", {
            header: "ОПИСАНИЕ",
            enableSorting: false,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("status", {
            header: "СТАТУС",
            enableSorting: true,
            cell: info => <StatusBadge status={info.getValue()} />,
        }),
        columnHelper.accessor("versions", {
            header: "ВЕРСИИ",
            enableSorting: false,
            cell: info => info.getValue()[0] ?? "-",
        }),
        columnHelper.accessor("taskCount", {
            id: "tasks",
            header: "ЗАДАЧИ",
            enableSorting: true,
        }),
        columnHelper.accessor("responsible", {
            header: "ОТВЕТСТВЕННЫЙ",
            enableSorting: false,
        }),
        columnHelper.accessor("createdAt", {
            id: "created",
            header: "СОЗДАН",
            enableSorting: true,
            cell: info => formatDate(info.getValue()),
        }),
    ];

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: projects,
        columns,
        state: {
            pagination,
            sorting,
            columnVisibility,
            rowSelection,
        },
        onPaginationChange: updater => {
            setPaginationState(prev => {
                const next = typeof updater === "function" ? updater(prev) : updater;
                return { pageIndex: next.pageIndex, pageSize: perPage };
            });
        },
        onSortingChange: handleSortingChange,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getRowId: row => String(row.id),
        manualPagination: true,
        pageCount: perPage > 0 ? Math.ceil(total / perPage) : -1,
        manualSorting: true,
        getCoreRowModel: getCoreRowModel(),
        enableRowSelection: true,
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
                            <div className="projects-page__columns-dropdown">
                                {ALL_COLUMNS.map(col => (
                                    <label key={col.id} className="projects-page__columns-option">
                                        <Checkbox
                                            inputSize="m"
                                            checked={table.getColumn(col.id)?.getIsVisible() ?? true}
                                            onCheckedChange={() => table.getColumn(col.id)?.toggleVisibility()}
                                        />
                                        {col.label}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="projects-page__controls">
                <Input
                    className="projects-page__controls-search"
                    placeholder="Найти проект..."
                    startIcon={<SearchIcon />}
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                />
            </div>

            <div className="projects-page__table-area" ref={containerRef}>
                {isPending && !data ? (
                    <p className="projects-page__empty">Загрузка проектов…</p>
                ) : isError && !data ? (
                    <p className="projects-page__empty">
                        {error instanceof Error ? error.message : "Ошибка загрузки"}
                    </p>
                ) : (
                    <DataTable table={table}>
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
