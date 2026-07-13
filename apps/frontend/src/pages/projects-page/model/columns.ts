export const ALL_COLUMNS = [
    { id: "name", label: "projects:table.name" },
    { id: "description", label: "projects:table.description" },
    { id: "status", label: "projects:table.status" },
    { id: "versions", label: "projects:table.versions" },
    { id: "tasks", label: "projects:table.tasks" },
    { id: "responsible", label: "projects:table.responsible" },
    { id: "created", label: "projects:table.created" }
] as const;

export type ColumnId = (typeof ALL_COLUMNS)[number]["id"];

export const COLUMN_IDS = ALL_COLUMNS.map(c => c.id);

export const DEFAULT_COLUMN_ORDER = ["select", ...COLUMN_IDS];

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = Object.fromEntries(
    ALL_COLUMNS.map(col => [col.id, true])
);
