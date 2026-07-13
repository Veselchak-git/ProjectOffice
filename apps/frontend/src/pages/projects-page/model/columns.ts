export const ALL_COLUMNS = [
    { id: "name", label: "НАЗВАНИЕ" },
    { id: "description", label: "ОПИСАНИЕ" },
    { id: "status", label: "СТАТУС" },
    { id: "versions", label: "ВЕРСИИ" },
    { id: "tasks", label: "ЗАДАЧИ" },
    { id: "responsible", label: "ОТВЕТСТВЕННЫЙ" },
    { id: "created", label: "СОЗДАН" },
] as const;

export type ColumnId = (typeof ALL_COLUMNS)[number]["id"];

export const COLUMN_IDS = ALL_COLUMNS.map(c => c.id);

export const DEFAULT_COLUMN_ORDER = ["select", ...COLUMN_IDS];

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> =
    Object.fromEntries(ALL_COLUMNS.map(col => [col.id, true]));
