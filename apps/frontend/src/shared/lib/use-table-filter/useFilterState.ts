import { useCallback, useMemo, useState } from "react";

import { clearFilterState, loadFilterState, saveFilterState } from "./filter-storage";
import type { FilterCondition, FilterState, TableFilterConfig } from "./types";

const MAX_CONDITIONS = 2;

function createEmptyState(config: TableFilterConfig): FilterState {
    return {
        groups: [{ logic: "AND", conditions: [] }],
        fieldConfigs: config.fields
    };
}

export function useFilterState(tableKey: string, config: TableFilterConfig) {
    const [filters, setFilters] = useState<FilterState>(() => {
        const saved = loadFilterState(tableKey);
        return saved ?? createEmptyState(config);
    });

    const [appliedFilters, setAppliedFilters] = useState<FilterState>(() => {
        const saved = loadFilterState(tableKey);
        return saved ?? filters;
    });

    const addCondition = useCallback(
        (groupIdx: number) => {
            setFilters(prev => {
                const group = prev.groups[groupIdx];
                if (!group || group.conditions.length >= MAX_CONDITIONS) return prev;

                const newCondition: FilterCondition = {
                    id: crypto.randomUUID(),
                    field: config.fields[0]?.field ?? "",
                    operator: "eq",
                    value: ""
                };

                const newGroups = [...prev.groups];
                newGroups[groupIdx] = {
                    ...group,
                    conditions: [...group.conditions, newCondition]
                };

                return { ...prev, groups: newGroups };
            });
        },
        [config.fields]
    );

    const updateCondition = useCallback((groupIdx: number, condIdx: number, updates: Partial<FilterCondition>) => {
        setFilters(prev => {
            const group = prev.groups[groupIdx];
            if (!group) return prev;

            const newConditions = group.conditions.map((c, i) => (i === condIdx ? { ...c, ...updates } : c));
            const newGroups = [...prev.groups];
            newGroups[groupIdx] = { ...group, conditions: newConditions };

            return { ...prev, groups: newGroups };
        });
    }, []);

    const toggleLogic = useCallback((groupIdx: number) => {
        setFilters(prev => {
            const group = prev.groups[groupIdx];
            if (!group) return prev;

            const newGroups = [...prev.groups];
            newGroups[groupIdx] = {
                ...group,
                logic: group.logic === "AND" ? "OR" : "AND"
            };

            return { ...prev, groups: newGroups };
        });
    }, []);

    const applyFilters = useCallback(
        (nextFilters?: FilterState) => {
            const state = nextFilters ?? filters;
            saveFilterState(tableKey, state);
            setAppliedFilters(state);
        },
        [tableKey, filters]
    );

    const removeCondition = useCallback(
        (groupIdx: number, condIdx: number) => {
            const group = filters.groups[groupIdx];
            if (!group) return;
            const nextState: FilterState = {
                ...filters,
                groups: filters.groups.map((g, i) =>
                    i === groupIdx ? { ...g, conditions: g.conditions.filter((_, j) => j !== condIdx) } : g
                )
            };
            setFilters(nextState);
            applyFilters(nextState);
        },
        [filters, setFilters, applyFilters]
    );

    const resetFilters = useCallback(() => {
        const empty = createEmptyState(config);
        clearFilterState(tableKey);
        setFilters(empty);
        setAppliedFilters(empty);
    }, [tableKey, config]);

    const hasActiveFilters = useMemo(() => {
        return appliedFilters.groups.some(g => g.conditions.length > 0);
    }, [appliedFilters]);

    const filterQueryString = useMemo(() => {
        if (!hasActiveFilters) return undefined;

        const allConditions = appliedFilters.groups.flatMap(g => g.conditions);
        if (allConditions.length === 0) return undefined;

        const query = {
            logic: appliedFilters.groups[0]?.logic ?? "AND",
            conditions: allConditions
        };

        return JSON.stringify(query);
    }, [appliedFilters, hasActiveFilters]);

    const allConditions = useMemo(() => appliedFilters.groups.flatMap(g => g.conditions), [appliedFilters]);

    const currentLogic = useMemo(() => filters.groups[0]?.logic ?? "AND", [filters]);

    const applyConditions = useCallback(
        (conditions: FilterCondition[], logic: "AND" | "OR") => {
            const nextState: FilterState = {
                groups: [{ logic, conditions }],
                fieldConfigs: config.fields
            };
            setFilters(nextState);
            applyFilters(nextState);
        },
        [setFilters, applyFilters, config.fields]
    );

    const removeFieldConditions = useCallback(
        (field: string) => {
            const group = filters.groups[0];
            if (!group) return;
            const nextState: FilterState = {
                ...filters,
                groups: [{ ...group, conditions: group.conditions.filter(c => c.field !== field) }]
            };
            setFilters(nextState);
            applyFilters(nextState);
        },
        [filters, setFilters, applyFilters]
    );

    return {
        filters,
        setFilters,
        addCondition,
        removeCondition,
        updateCondition,
        toggleLogic,
        applyFilters,
        resetFilters,
        hasActiveFilters,
        filterQueryString,
        allConditions,
        currentLogic,
        applyConditions,
        removeFieldConditions
    };
}
