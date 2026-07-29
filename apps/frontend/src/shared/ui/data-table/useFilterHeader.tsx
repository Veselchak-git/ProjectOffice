/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { SortingState } from "@tanstack/react-table";
import { useCallback } from "react";

import type { FieldOption, FilterCondition } from "@/shared/lib/use-table-filter/types";

import { ColumnHeader } from "./ColumnHeader";
import { FilterPopover } from "./FilterPopover";

export interface UseFilterHeaderOptions {
    sorting: SortingState;
    isFieldFiltered: (field: string) => boolean;
    filterConfig: { fields: FieldOption[] };
    allConditions: FilterCondition[];
    currentLogic: "AND" | "OR";
    applyConditions: (conditions: FilterCondition[], logic: "AND" | "OR") => void;
    removeFieldConditions: (field: string) => void;
    openFilter: string | null;
    setOpenFilter: (field: string | null) => void;
    bumpKey: (field: string) => void;
    popoverKeys: Record<string, number>;
}

export function useFilterHeader(options: UseFilterHeaderOptions) {
    const {
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
    } = options;

    return useCallback(
        (title: string, field: string, fieldsOverride?: FieldOption[]) => () => {
            const sorted = sorting.find(s => s.id === field);
            const sortState: "none" | "asc" | "desc" = sorted ? (sorted.desc ? "desc" : "asc") : "none";

            return (
                <ColumnHeader
                    title={title}
                    field={field}
                    sortState={sortState}
                    isActiveFilter={isFieldFiltered(field)}
                    onFilterClick={f => {
                        setOpenFilter(f);
                        bumpKey(f);
                    }}
                >
                    <FilterPopover
                        key={`${field}-popover-${popoverKeys[field] ?? 0}`}
                        fields={fieldsOverride ?? filterConfig.fields}
                        conditions={allConditions}
                        logic={currentLogic}
                        initialField={field}
                        onApply={applyConditions}
                        onReset={() => removeFieldConditions(field)}
                        isOpen={openFilter === field}
                        onClose={() => setOpenFilter(null)}
                    />
                </ColumnHeader>
            );
        },
        [
            sorting,
            isFieldFiltered,
            filterConfig.fields,
            allConditions,
            currentLogic,
            applyConditions,
            removeFieldConditions,
            openFilter,
            setOpenFilter,
            bumpKey,
            popoverKeys
        ]
    );
}
