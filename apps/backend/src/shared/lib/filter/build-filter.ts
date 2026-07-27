/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

import type { FilterGroup, FilterCondition, FieldDefinition } from './types.js';

/**
 * Рекурсивно преобразует FilterGroup в Prisma WhereInput.
 *
 * @param group - корневая группа фильтров (всегда AND)
 * @fields - список доступных полей для фильтрации
 * @returns Prisma-compatible WhereInput или undefined если фильтр пуст
 */
export function buildFilter(
    group: FilterGroup | undefined,
    fields: FieldDefinition[]
): Record<string, unknown> | undefined {
    if (!group || group.conditions.length === 0) {
        return undefined;
    }

    const allowedFields = new Set(fields.map(f => f.field));
    const fieldDefs = new Map(fields.map(f => [f.field, f]));

    const buildCondition = (condition: FilterCondition): Record<string, unknown> | undefined => {
        if (!allowedFields.has(condition.field)) {
            return undefined;
        }

        const fieldDef = fieldDefs.get(condition.field);
        if (!fieldDef) return undefined;

        const { field, operator, value } = condition;

        switch (operator) {
            case 'eq':
                return { [field]: value };
            case 'neq':
                return { [field]: { not: value } };
            case 'contains':
                return { [field]: { contains: value, mode: 'insensitive' } };
            case 'not_contains':
                return { [field]: { not: { contains: value }, mode: 'insensitive' } };
            case 'starts_with':
                return { [field]: { startsWith: value, mode: 'insensitive' } };
            case 'in':
                return { [field]: { in: Array.isArray(value) ? value : [value] } };
            case 'not_in':
                return { [field]: { notIn: Array.isArray(value) ? value : [value] } };
            case 'after':
                return { [field]: { gt: new Date(value as string) } };
            case 'before':
                return { [field]: { lt: new Date(value as string) } };
            default:
                return undefined;
        }
    };

    const conditions = group.conditions
        .map(buildCondition)
        .filter((c: Record<string, unknown> | undefined): c is Record<string, unknown> => c !== undefined);

    if (conditions.length === 0) {
        return undefined;
    }

    if (conditions.length === 1) {
        return conditions[0];
    }

    return { [group.logic]: conditions };
}
