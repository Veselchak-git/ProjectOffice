import { NS } from "@helpdesk-portal/i18n";

import { createColumnMeta } from "@/shared/ui/data-table";

export const { ALL_COLUMNS, COLUMN_IDS, DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } = createColumnMeta([
    { id: "name", label: `${NS.projects}:table.name` },
    { id: "description", label: `${NS.projects}:table.description` },
    { id: "status", label: `${NS.projects}:table.status` },
    { id: "versions", label: `${NS.projects}:table.versions` },
    { id: "tasks", label: `${NS.projects}:table.tasks` },
    { id: "responsible", label: `${NS.projects}:table.responsible` },
    { id: "createdAt", label: `${NS.projects}:table.created` }
]);

export type ColumnId = (typeof ALL_COLUMNS)[number]["id"];
