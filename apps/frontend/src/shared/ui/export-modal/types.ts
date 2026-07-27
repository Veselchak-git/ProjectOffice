/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

export interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (params: ExportParams) => void;
    hasActiveFilters?: boolean;
    hasActiveSorting?: boolean;
    activeFiltersDescription?: string;
    activeSortingDescription?: string;
    availableLocales: string[];
    columnLabelKeys?: Record<string, string>;
    filterQueryString?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    exportUrl?: string;
    columnNamespace?: string;
    fileNamePrefix?: { ru: string; en: string };
}

export interface ExportParams {
    applyFilters: boolean;
    applySorting: boolean;
    locale: string;
    filterQueryString?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
