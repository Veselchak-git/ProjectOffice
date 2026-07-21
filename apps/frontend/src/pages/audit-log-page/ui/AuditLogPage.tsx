/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AUDIT } from "@helpdesk-portal/i18n";
import ExportIcon from "@helpdesk-portal/icons/Export.svg?react";
import GearIcon from "@helpdesk-portal/icons/GearIcon.svg?react";
import { Button } from "@helpdesk-portal/ui-kit";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef, type SortingState, createColumnHelper } from "@tanstack/react-table";
import { useCallback, useMemo, useRef, useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { rootReducer } from "@/app/store";

import type { AuditLog, FetchAuditLogsParams } from "@/entities/audit-log";
import { fetchAuditLogs } from "@/entities/audit-log";

import { useAuditLogStream, type AuditLogSseEvent } from "@/shared/lib/sse";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { useClickOutside } from "@/shared/lib/use-click-outside";
import { useDynamicPerPage } from "@/shared/lib/use-dynamic-per-page";
import { usePersistColumnSettings } from "@/shared/lib/use-persist-column-settings";
import { useTable } from "@/shared/lib/use-table";

import {
    DataTable,
    SortableColumnItem,
    createDateColumn,
    reorderColumn
} from "@/shared/ui/data-table";

import { ALL_COLUMNS } from "../model/columns";
import {
    auditLogPageSlice,
    selectColumnOrder,
    selectColumnVisibility,
    setColumnOrder,
    setColumnVisibility
} from "../model/audit-log-page-slice";
import { AuditLogDetailModal } from "./AuditLogDetailModal";
import "./AuditLogPage.css";

rootReducer.inject(auditLogPageSlice);

const columnHelper = createColumnHelper<AuditLog>();

export const AuditLogPage: FC = () => {
    const { t } = useTranslation(AUDIT);
    const dispatch = useAppDispatch();
    const columnVisibility = useAppSelector(selectColumnVisibility);
    const columnOrder = useAppSelector(selectColumnOrder);
    const [pageIndex, setPageIndex] = useState(0);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnsOpen, setColumnsOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const columnsRef = useRef<HTMLDivElement>(null);

    useClickOutside(columnsRef, () => setColumnsOpen(false));

    const containerRef = useRef<HTMLDivElement>(null);
    const { perPage, ready } = useDynamicPerPage(containerRef, {
        rowHeight: 48,
        theadHeight: 36,
        paginationHeight: 34,
        min: 5
    });

    const sortBy = sorting[0]?.id;
    const sortOrder: "asc" | "desc" | undefined = sorting[0]?.desc ? "desc" : sorting[0] ? "asc" : undefined;
    const page = pageIndex + 1;

    const auditLogParams = useMemo(() => ({
        page,
        perPage,
        ...(sortBy ? { sortBy } : {}),
        ...(sortOrder ? { sortOrder } : {})
    }) satisfies FetchAuditLogsParams, [page, perPage, sortBy, sortOrder]);

    const queryClient = useQueryClient();

    const handleSseEvent = useCallback((event: AuditLogSseEvent) => {
        if (event.type !== "audit-log") return;
        queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    }, [queryClient]);

    useAuditLogStream(handleSseEvent);

    const { data, isPending, isError, error } = useQuery({
        queryKey: ["audit-logs", auditLogParams],
        queryFn: () => fetchAuditLogs(auditLogParams),
        enabled: ready,
        placeholderData: keepPreviousData
    });

    const logs = data?.logs ?? [];
    const total = data?.total ?? 0;

    const columns = [
        columnHelper.accessor("eventType", {
            header: t("table.eventType"),
            enableSorting: true
        }),
        columnHelper.accessor("subjectType", {
            header: t("table.subjectType"),
            enableSorting: true
        }),
        columnHelper.accessor("objectType", {
            header: t("table.objectType"),
            enableSorting: true
        }),
        columnHelper.accessor("subjectId", {
            header: t("table.subjectId"),
            enableSorting: false
        }),
        columnHelper.accessor("objectId", {
            header: t("table.objectId"),
            enableSorting: false
        }),
        createDateColumn(columnHelper, t)
    ];

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
        },
        resetKey: undefined
    });

    usePersistColumnSettings({
        page: "auditLog",
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

    function handleDragEnd(event: DragEndEvent) {
        reorderColumn(event, columnOrder, next => dispatch(setColumnOrder(next)));
    }

    return (
        <div className="audit-log-page">
            <div className="audit-log-page__title-area">
                <div className="audit-log-page__title-text">
                    <h1 className="audit-log-page__title-heading">{t("page.title")}</h1>
                    <p className="audit-log-page__title-subtitle">{t("page.subtitle", { total })}</p>
                </div>
                <div className="audit-log-page__actions">
                    <Button className="audit-log-page__export-btn" type="button" startIcon={<ExportIcon />}>
                        {t("actions.export")}
                    </Button>
                    <div className="audit-log-page__columns-wrapper" ref={columnsRef}>
                        <Button
                            className="audit-log-page__columns-btn"
                            type="button"
                            onClick={() => setColumnsOpen(v => !v)}
                            startIcon={<GearIcon />}
                        >
                            {t("actions.columns")}
                        </Button>

                        {columnsOpen && (
                            <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                                <SortableContext items={columnOrder} strategy={verticalListSortingStrategy}>
                                    <div className="audit-log-page__columns-dropdown">
                                    {columnOrder
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

            <div className="audit-log-page__table-area" ref={containerRef}>
                {isPending && !data ? (
                    <p className="audit-log-page__empty">{t("loading")}</p>
                ) : isError && !data ? (
                    <p className="audit-log-page__empty">{error instanceof Error ? error.message : t("error.loading")}</p>
                ) : (
                    <DataTable table={table} total={total} onRowDoubleClick={log => {
                        if (log.oldValue != null || log.newValue != null) {
                            setSelectedLog(log);
                        }
                    }} />
                )}
            </div>

            {selectedLog && <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
        </div>
    );
};
