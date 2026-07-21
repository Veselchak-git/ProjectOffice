/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { AUDIT } from "@helpdesk-portal/i18n";

import { createColumnMeta } from "@/shared/ui/data-table";

export const { ALL_COLUMNS, COLUMN_IDS, DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } = createColumnMeta([
    { id: "eventType", label: `${AUDIT}:table.eventType` },
    { id: "subjectType", label: `${AUDIT}:table.subjectType` },
    { id: "objectType", label: `${AUDIT}:table.objectType` },
    { id: "subjectId", label: `${AUDIT}:table.subjectId` },
    { id: "objectId", label: `${AUDIT}:table.objectId` },
    { id: "createdAt", label: `${AUDIT}:table.createdAt` }
]);
