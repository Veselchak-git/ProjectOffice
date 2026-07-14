import { NS } from "@helpdesk-portal/i18n";

export const ALL_COLUMNS = [
    { id: "name", label: `${NS.projects}:table.name` },
    { id: "description", label: `${NS.projects}:table.description` },
    { id: "status", label: `${NS.projects}:table.status` },
    { id: "versions", label: `${NS.projects}:table.versions` },
    { id: "tasks", label: `${NS.projects}:table.tasks` },
    { id: "responsible", label: `${NS.projects}:table.responsible` },
    { id: "created", label: `${NS.projects}:table.created` }
] as const;

export type ColumnId = (typeof ALL_COLUMNS)[number]["id"];

export const COLUMN_IDS = ALL_COLUMNS.map(c => c.id);

export const DEFAULT_COLUMN_ORDER = ["select", ...COLUMN_IDS];

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = Object.fromEntries(
    ALL_COLUMNS.map(col => [col.id, true])
);
