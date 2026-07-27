/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { DragEndEvent } from "@dnd-kit/core";
import { BrowserStorage } from "@helpdesk-portal/ui-kit";
import type { OnChangeFn, SortingState, VisibilityState } from "@tanstack/react-table";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

import { useClickOutside } from "@/shared/lib/use-click-outside";
import { useDynamicPerPage } from "@/shared/lib/use-dynamic-per-page";
import { usePersistColumnSettings } from "@/shared/lib/use-persist-column-settings";

import { reorderColumn } from "@/shared/ui/data-table";

const storage = BrowserStorage.create();

export interface UseTablePageOptions {
    page: string;

    columnVisibility: VisibilityState;
    columnOrder: string[];
    onColumnVisibilityChange: OnChangeFn<VisibilityState>;
    onColumnOrderChange: OnChangeFn<string[]>;
}

export interface UseTablePageResult {
    containerRef: RefObject<HTMLDivElement | null>;
    columnsRef: RefObject<HTMLDivElement | null>;
    columnsOpen: boolean;
    setColumnsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleDragEnd: (event: DragEndEvent) => void;
    pageIndex: number;
    setPageIndex: React.Dispatch<React.SetStateAction<number>>;
    sorting: SortingState;
    setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
    perPage: number;
    ready: boolean;
}

export function useTablePage({
    page: pageSlug,
    columnVisibility,
    columnOrder,
    onColumnVisibilityChange,
    onColumnOrderChange
}: UseTablePageOptions): UseTablePageResult {
    const [pageIndex, setPageIndex] = useState(0);
    const [sorting, setSorting] = useState<SortingState>(() => {
        if (!storage) return [];
        const saved = storage.getArray<{ id: string; desc: boolean }>(`sorting:${pageSlug}`);
        return saved ?? [];
    });
    const [columnsOpen, setColumnsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const columnsRef = useRef<HTMLDivElement>(null);

    useClickOutside(columnsRef, () => setColumnsOpen(false));

    const { perPage, ready } = useDynamicPerPage(containerRef, {
        rowHeight: 48,
        theadHeight: 36,
        paginationHeight: 34,
        min: 5
    });

    useEffect(() => {
        if (!storage) return;
        storage.setArray(`sorting:${pageSlug}`, sorting);
    }, [pageSlug, sorting]);

    usePersistColumnSettings({
        page: pageSlug,
        columnVisibility,
        columnOrder,
        onColumnVisibilityChange,
        onColumnOrderChange
    });

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            reorderColumn(event, columnOrder, onColumnOrderChange);
        },
        [columnOrder, onColumnOrderChange]
    );

    return {
        containerRef,
        columnsRef,
        columnsOpen,
        setColumnsOpen,
        handleDragEnd,
        pageIndex,
        setPageIndex,
        sorting,
        setSorting,
        perPage,
        ready
    };
}
