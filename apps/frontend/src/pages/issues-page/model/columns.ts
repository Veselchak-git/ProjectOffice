import { NS } from "@helpdesk-portal/i18n";

export const ALL_COLUMNS = [
    { id: "title", label: `${NS.issues}:table.title` },
    { id: "projectName", label: `${NS.issues}:table.project` },
    { id: "status", label: `${NS.issues}:table.status` },
    { id: "priority", label: `${NS.issues}:table.priority` },
    { id: "category", label: `${NS.issues}:table.category` },
    { id: "assigneeLogin", label: `${NS.issues}:table.assignee` },
    { id: "createdAt", label: `${NS.issues}:table.created` }
] as const;

export const COLUMN_IDS = ALL_COLUMNS.map(c => c.id);

export const DEFAULT_COLUMN_ORDER = ["select", ...COLUMN_IDS];

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = Object.fromEntries(
    ALL_COLUMNS.map(col => [col.id, true])
);
