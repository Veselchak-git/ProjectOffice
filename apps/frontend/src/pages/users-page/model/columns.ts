import { NS } from "@helpdesk-portal/i18n";

export const ALL_COLUMNS = [
    { id: "login", label: `${NS.users}:table.login` },
    { id: "role", label: `${NS.users}:table.role` },
    { id: "createdAt", label: `${NS.users}:table.created` },
    { id: "actions", label: "" }
] as const;

export const COLUMN_IDS = ALL_COLUMNS.map(c => c.id);

export const DEFAULT_COLUMN_ORDER = ["select", ...COLUMN_IDS];

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = Object.fromEntries(
    ALL_COLUMNS.map(col => [col.id, true])
);
