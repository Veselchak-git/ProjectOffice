/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

export type FilterOperator = 'eq' | 'neq' | 'contains' | 'not_contains' | 'starts_with' | 'in' | 'not_in' | 'after' | 'before';

export type FilterCondition = {
    field: string;
    operator: FilterOperator;
    value: string | string[];
};

export type FilterGroup = {
    logic: 'AND' | 'OR';
    conditions: FilterCondition[];
};

export type FilterQuery = FilterGroup;

export type FieldDefinition = {
    field: string;
    label: string;
    type: 'enum' | 'text' | 'date';
    enumValues?: string[];
};
