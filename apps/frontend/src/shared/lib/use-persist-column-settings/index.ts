import type { VisibilityState } from "@tanstack/react-table";
import { useEffect, useRef } from "react";

import { fetchUserPreference, saveUserPreference } from "@/entities/user-preferences";

type OnChange<T> = (updater: T | ((prev: T) => T)) => void;

interface PersistedTableSettings {
    columnVisibility?: VisibilityState;
    columnOrder?: string[];
}

export interface UsePersistColumnSettingsOptions {
    page: string;
    columnVisibility: VisibilityState;
    columnOrder: string[];
    onColumnVisibilityChange: OnChange<VisibilityState>;
    onColumnOrderChange: OnChange<string[]>;
}

export function usePersistColumnSettings({
    page,
    columnVisibility,
    columnOrder,
    onColumnVisibilityChange,
    onColumnOrderChange
}: UsePersistColumnSettingsOptions): void {
    const loaded = useRef(false);
    const visibilityRef = useRef(onColumnVisibilityChange);
    const orderRef = useRef(onColumnOrderChange);
    const savedVisibility = useRef<VisibilityState | null>(null);
    const savedOrder = useRef<string[] | null>(null);

    useEffect(() => {
        visibilityRef.current = onColumnVisibilityChange;
        orderRef.current = onColumnOrderChange;
    });

    useEffect(() => {
        fetchUserPreference(page).then(settings => {
            if (loaded.current) return;
            loaded.current = true;

            if (!settings) return;

            const persisted = settings as PersistedTableSettings;

            if (persisted.columnVisibility && Object.keys(persisted.columnVisibility).length > 0) {
                visibilityRef.current(persisted.columnVisibility);
            }
            if (persisted.columnOrder && persisted.columnOrder.length > 0) {
                orderRef.current(persisted.columnOrder);
            }

            savedVisibility.current = persisted.columnVisibility ?? null;
            savedOrder.current = persisted.columnOrder ?? null;
        });
    }, [page]);

    useEffect(() => {
        if (!loaded.current) return;

        if (savedVisibility.current === columnVisibility && savedOrder.current === columnOrder) {
            return;
        }

        const timer = setTimeout(() => {
            savedVisibility.current = columnVisibility;
            savedOrder.current = columnOrder;
            saveUserPreference(page, { columnVisibility, columnOrder });
        }, 1000);

        return () => clearTimeout(timer);
    }, [page, columnVisibility, columnOrder]);
}
