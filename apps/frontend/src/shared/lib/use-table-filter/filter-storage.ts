import type { FilterState } from "./types";

const FILTER_STORAGE_PREFIX = "app-filter-";

function getStorageKey(key: string): string {
    return `${FILTER_STORAGE_PREFIX}${key}`;
}

export function loadFilterState(key: string): FilterState | null {
    try {
        const raw = localStorage.getItem(getStorageKey(key));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Минимальная валидация структуры
        if (
            typeof parsed !== "object" ||
            parsed === null ||
            !Array.isArray(parsed.groups) ||
            !Array.isArray(parsed.fieldConfigs)
        ) {
            return null;
        }
        return parsed as FilterState;
    } catch {
        return null;
    }
}

export function saveFilterState(key: string, state: FilterState): void {
    try {
        localStorage.setItem(getStorageKey(key), JSON.stringify(state));
    } catch {
        // Игнорируем ошибки quota exceeded и т.д.
    }
}

export function clearFilterState(key: string): void {
    localStorage.removeItem(getStorageKey(key));
}
