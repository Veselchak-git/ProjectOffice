/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { PROJECTS } from "@helpdesk-portal/i18n";

import { createColumnMeta } from "@/shared/ui/data-table";

export const { ALL_COLUMNS, COLUMN_IDS, DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } = createColumnMeta([
    { id: "name", label: `${PROJECTS}:table.name` },
    { id: "description", label: `${PROJECTS}:table.description` },
    { id: "status", label: `${PROJECTS}:table.status` },
    { id: "versions", label: `${PROJECTS}:table.versions` },
    { id: "tasks", label: `${PROJECTS}:table.tasks` },
    { id: "responsible", label: `${PROJECTS}:table.responsible` },
    { id: "createdAt", label: `${PROJECTS}:table.created` }
]);

export type ColumnId = (typeof ALL_COLUMNS)[number]["id"];
