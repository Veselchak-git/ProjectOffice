export interface ColumnDefMeta {
    id: string;
    label: string;
}

export interface ColumnMetaResult {
    ALL_COLUMNS: ColumnDefMeta[];
    COLUMN_IDS: string[];
    DEFAULT_COLUMN_ORDER: string[];
    DEFAULT_COLUMN_VISIBILITY: Record<string, boolean>;
}

export function createColumnMeta(columns: ColumnDefMeta[]): ColumnMetaResult {
    const ids = columns.map(c => c.id);
    return {
        ALL_COLUMNS: columns,
        COLUMN_IDS: ids,
        DEFAULT_COLUMN_ORDER: ["select", ...ids],
        DEFAULT_COLUMN_VISIBILITY: Object.fromEntries(columns.map(col => [col.id, true]))
    };
}
