import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NS } from "@helpdesk-portal/i18n";
import ExportIcon from "@helpdesk-portal/icons/Export.svg?react";
import GearIcon from "@helpdesk-portal/icons/GearIcon.svg?react";
import { Checkbox } from "@helpdesk-portal/ui-kit";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
    type ColumnDef,
    type RowSelectionState,
    type SortingState,
    type VisibilityState,
    createColumnHelper
} from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import type { FetchIssuesParams, Issue } from "@/entities/issue";
import { fetchIssues } from "@/entities/issue";

import { formatDate } from "@/shared/lib/format-date";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { useDynamicPerPage } from "@/shared/lib/use-dynamic-per-page";
import { useTable } from "@/shared/lib/use-table";

import { DataTable } from "@/shared/ui/data-table";

import { ALL_COLUMNS } from "../model/columns";
import {
    selectColumnOrder,
    selectColumnVisibility,
    selectRowSelection,
    setColumnOrder,
    setColumnVisibility,
    setRowSelection
} from "../model/issues-page-slice";
import "./IssuesPage.css";

const columnHelper = createColumnHelper<Issue>();

export const IssuesPage: FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(NS.issues);
    const dispatch = useAppDispatch();
    const columnVisibility = useAppSelector(selectColumnVisibility);
    const columnOrder = useAppSelector(selectColumnOrder);
    const rowSelection = useAppSelector(selectRowSelection);
    const [pageIndex, setPageIndex] = useState(0);
    const [sorting, setSorting] = useState<SortingState>([]);
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
        columnHelper.accessor("createdAt", {
            id: "createdAt",
            header: t("table.created"),
            enableSorting: true,
            cell: info => formatDate(info.getValue())
        })
    ];

    return (
        <div className="issues-page">
            <div className="issues-page__title-area">
                <div className="issues-page__title-text">
                    <h1 className="issues-page__title-heading">{t("page.title")}</h1>
                    <p className="issues-page__title-subtitle">{t("page.subtitle", { total })}</p>
                </div>
                <div className="issues-page__actions">
                    <button className="issues-page__export-btn" type="button">
                        <ExportIcon />
                        {t("actions.export")}
                    </button>
                </div>
            </div>

            <div className="issues-page__table-area" ref={containerRef}>
                {isPending && !data ? (
                    <p className="issues-page__empty">{t("loading")}</p>
                ) : isError && !data ? (
                    <p className="issues-page__empty">{error instanceof Error ? error.message : t("error.loading")}</p>
                ) : (
                    <IssuesTable
                        issues={issues}
                        columns={columns as ColumnDef<Issue>[]}
                        columnOrder={columnOrder}
                        sorting={sorting}
                        columnVisibility={columnVisibility}
                        rowSelection={rowSelection}
                        perPage={perPage}
                        total={total}
                        pageIndex={pageIndex}
                        onPageIndexChange={setPageIndex}
                        columnsOpen={columnsOpen}
                        columnsRef={columnsRef}
                        setColumnsOpen={setColumnsOpen}
                        onSortingChange={setSorting}
                        onColumnOrderChange={updater => {
                            const next = typeof updater === "function" ? updater(columnOrder) : updater;
                            dispatch(setColumnOrder(next));
                        }}
                        onColumnVisibilityChange={updater => {
                            const next = typeof updater === "function" ? updater(columnVisibility) : updater;
                            dispatch(setColumnVisibility(next));
                        }}
                        onRowSelectionChange={updater => {
                            const next = typeof updater === "function" ? updater(rowSelection) : updater;
                            dispatch(setRowSelection(next));
                        }}
                        handleDragEnd={handleDragEnd}
                        navigate={navigate}
                        t={t}
                    />
                )}
            </div>
        </div>
    );
};

interface IssuesTableProps {
    issues: Issue[];
    columns: ColumnDef<Issue>[];
    columnOrder: string[];
    sorting: SortingState;
    columnVisibility: VisibilityState;
    rowSelection: RowSelectionState;
    perPage: number;
    total: number;
    pageIndex: number;
    onPageIndexChange: (pageIndex: number) => void;
    columnsOpen: boolean;
    columnsRef: React.RefObject<HTMLDivElement | null>;
    setColumnsOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
    onSortingChange: (updater: SortingState | ((prev: SortingState) => SortingState)) => void;
    onColumnOrderChange: (updater: string[] | ((prev: string[]) => string[])) => void;
    onColumnVisibilityChange: (
        updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
    ) => void;
    onRowSelectionChange: (
        updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
    ) => void;
    handleDragEnd: (event: DragEndEvent) => void;
    navigate: (path: string) => void;
    t: (key: string) => string;
}

function IssuesTable({
    issues,
    columns,
    columnOrder,
    sorting,
    columnVisibility,
    rowSelection,
    perPage,
    total,
    pageIndex,
    onPageIndexChange,
    columnsOpen,
    columnsRef,
    setColumnsOpen,
    onSortingChange,
    onColumnOrderChange,
    onColumnVisibilityChange,
    onRowSelectionChange,
    handleDragEnd,
    navigate,
    t
}: IssuesTableProps) {
    const { table } = useTable({
        data: issues,
        columns,
        getRowId: row => String(row.id),
        total,
        pageSize: perPage,
        pageIndex,
        onPageIndexChange,
        sorting,
        onSortingChange,
        columnVisibility,
        columnOrder,
        rowSelection,
        onColumnOrderChange,
        onColumnVisibilityChange,
        onRowSelectionChange,
        resetKey: undefined,
        enableRowSelection: true
    });

    return (
        <div className="issues-page__table-wrapper">
            <div className="issues-page__table-toolbar">
                <div className="issues-page__columns-wrapper" ref={columnsRef}>
                    <button className="issues-page__columns-btn" type="button" onClick={() => setColumnsOpen(v => !v)}>
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
            <DataTable table={table} onRowDoubleClick={row => navigate(`/tasks/${row.id}`)} total={total} />
        </div>
    );
}

interface SortableColumnItemProps {
    id: string;
    label: string;
    isVisible: boolean;
    onToggle: () => void;
}

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

const SortableColumnItem: FC<SortableColumnItemProps> = ({ id, label, isVisible, onToggle }) => {
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
            className={`issues-page__columns-option${isDragging ? " issues-page__columns-option--dragging" : ""}`}
        >
            <button className="issues-page__columns-drag-btn" type="button" {...attributes} {...listeners}>
                <GripIcon />
            </button>
            <Checkbox inputSize="m" checked={isVisible} onCheckedChange={onToggle} />
            <span className="issues-page__columns-label" onClick={onToggle}>
                {label}
            </span>
        </div>
    );
};
