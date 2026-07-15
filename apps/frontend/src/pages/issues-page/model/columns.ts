import { NS } from "@helpdesk-portal/i18n";

import { createColumnMeta } from "@/shared/ui/data-table";

export const { ALL_COLUMNS, COLUMN_IDS, DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } = createColumnMeta([
    { id: "title", label: `${NS.issues}:table.title` },
    { id: "projectName", label: `${NS.issues}:table.project` },
    { id: "status", label: `${NS.issues}:table.status` },
    { id: "priority", label: `${NS.issues}:table.priority` },
    { id: "category", label: `${NS.issues}:table.category` },
    { id: "assigneeLogin", label: `${NS.issues}:table.assignee` },
    { id: "createdAt", label: `${NS.issues}:table.created` }
]);
