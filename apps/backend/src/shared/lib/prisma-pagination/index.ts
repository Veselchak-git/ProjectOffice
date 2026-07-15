/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

export function paginationArgs(page = 1, perPage = 20): { skip: number; take: number } {
    return { skip: (page - 1) * perPage, take: perPage };
}

export function buildOrderBy(
    allowedFields: Set<string>,
    sortBy: string | undefined,
    sortOrder: string,
    defaultOrder: Record<string, unknown>,
    customBuilders?: Record<string, (order: string) => Record<string, unknown>>,
): Record<string, unknown> {
    if (!sortBy || !allowedFields.has(sortBy)) {
        return defaultOrder;
    }
    const custom = customBuilders?.[sortBy];
    if (custom) {
        return custom(sortOrder);
    }
    return { [sortBy]: sortOrder };
}
