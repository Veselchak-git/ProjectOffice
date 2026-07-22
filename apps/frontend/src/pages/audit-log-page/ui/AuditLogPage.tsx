/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { AUDIT } from "@helpdesk-portal/i18n";
import ExportIcon from "@helpdesk-portal/icons/Export.svg?react";
import { Button } from "@helpdesk-portal/ui-kit";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { rootReducer } from "@/app/store";

import type { AuditLog, FetchAuditLogsParams } from "@/entities/audit-log";
import { fetchAuditLogs } from "@/entities/audit-log";

import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { type AuditLogSseEvent, useAuditLogStream } from "@/shared/lib/sse";
import { useTable } from "@/shared/lib/use-table";
import { useTablePage } from "@/shared/lib/use-table-page";

import { ColumnsDropdown } from "@/shared/ui/columns-dropdown";
import { DataTable, createDateColumn } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import {
    auditLogPageSlice,
    selectColumnOrder,
    selectColumnVisibility,
    setColumnOrder,
    setColumnVisibility
} from "../model/audit-log-page-slice";
import { ALL_COLUMNS } from "../model/columns";
import { AuditLogDetailModal } from "./AuditLogDetailModal";
import styles from "./AuditLogPage.module.css";

rootReducer.inject(auditLogPageSlice);

const columnHelper = createColumnHelper<AuditLog>();

export const AuditLogPage: FC = () => {
    const { t } = useTranslation(AUDIT);
    const dispatch = useAppDispatch();
    const columnVisibility = useAppSelector(selectColumnVisibility);
    const columnOrder = useAppSelector(selectColumnOrder);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

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

    const sortBy = sorting[0]?.id;
    const sortOrder: "asc" | "desc" | undefined = sorting[0]?.desc ? "desc" : sorting[0] ? "asc" : undefined;
    const page = pageIndex + 1;

    const auditLogParams = useMemo(
        () =>
            ({
                page,
                perPage,
                ...(sortBy ? { sortBy } : {}),
                ...(sortOrder ? { sortOrder } : {})
            }) satisfies FetchAuditLogsParams,
        [page, perPage, sortBy, sortOrder]
    );

    const queryClient = useQueryClient();

    const handleSseEvent = useCallback(
        (event: AuditLogSseEvent) => {
            if (event.type !== "audit-log") return;
            queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
        },
        [queryClient]
    );

    useAuditLogStream(handleSseEvent);

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

            <div className={styles["audit-log-page__table-area"]} ref={containerRef}>
                {isPending && !data ? (
                    <p className={styles["audit-log-page__empty"]}>{t("loading")}</p>
                ) : isError && !data ? (
                    <p className={styles["audit-log-page__empty"]}>
                        {error instanceof Error ? error.message : t("error.loading")}
                    </p>
                ) : (
                    <DataTable
                        table={table}
                        total={total}
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
        </div>
    );
};
