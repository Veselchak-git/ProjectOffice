/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { ISSUES } from "@helpdesk-portal/i18n";

import { createColumnMeta } from "@/shared/ui/data-table";

export const { ALL_COLUMNS, COLUMN_IDS, DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } = createColumnMeta([
    { id: "title", label: `${ISSUES}:table.title` },
    { id: "projectName", label: `${ISSUES}:table.project` },
    { id: "status", label: `${ISSUES}:table.status` },
    { id: "priority", label: `${ISSUES}:table.priority` },
    { id: "category", label: `${ISSUES}:table.category` },
    { id: "assigneeLogin", label: `${ISSUES}:table.assignee` },
    { id: "createdAt", label: `${ISSUES}:table.created` }
]);
