/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

import { describe, it, expect } from 'vitest';
import { buildFilter } from './build-filter.js';
import type { FieldDefinition, FilterGroup } from './types.js';

const TEST_FIELDS: FieldDefinition[] = [
    { field: 'status', label: 'Статус', type: 'enum', enumValues: ['backlog', 'todo', 'in_progress', 'done'] },
    { field: 'priority', label: 'Приоритет', type: 'enum', enumValues: ['critical', 'high', 'medium', 'low'] },
    { field: 'title', label: 'Название', type: 'text' },
    { field: 'createdAt', label: 'Дата создания', type: 'date' },
];

describe('buildFilter', () => {
    describe('empty / undefined input', () => {
        it('returns undefined for undefined group', () => {
            expect(buildFilter(undefined, TEST_FIELDS)).toBeUndefined();
        });

        it('returns undefined for empty conditions', () => {
            const group: FilterGroup = { logic: 'AND', conditions: [] };
            expect(buildFilter(group, TEST_FIELDS)).toBeUndefined();
        });
    });

    describe('operators', () => {
        it('eq operator', () => {
            const group: FilterGroup = {
                logic: 'AND',
                conditions: [{ field: 'status', operator: 'eq', value: 'done' }],
            };
            expect(buildFilter(group, TEST_FIELDS)).toEqual({ status: 'done' });
        });

        it('neq operator', () => {
            const group: FilterGroup = {
                logic: 'AND',
                conditions: [{ field: 'status', operator: 'neq', value: 'done' }],
            };
            expect(buildFilter(group, TEST_FIELDS)).toEqual({ status: { not: 'done' } });
        });

        it('contains operator', () => {
            const group: FilterGroup = {
                logic: 'AND',
                conditions: [{ field: 'title', operator: 'contains', value: 'test' }],
            };
            expect(buildFilter(group, TEST_FIELDS)).toEqual({
                title: { contains: 'test', mode: 'insensitive' },
            });
        });

        it('not_contains operator', () => {
            const group: FilterGroup = {
                logic: 'AND',
                conditions: [{ field: 'title', operator: 'not_contains', value: 'draft' }],
            };
            expect(buildFilter(group, TEST_FIELDS)).toEqual({
                title: { not: { contains: 'draft' }, mode: 'insensitive' },
            });
        });

        it('starts_with operator', () => {
            const group: FilterGroup = {
                logic: 'AND',
                conditions: [{ field: 'title', operator: 'starts_with', value: 'API' }],
            };
            expect(buildFilter(group, TEST_FIELDS)).toEqual({
                title: { startsWith: 'API', mode: 'insensitive' },
            });
        });

        it('in operator with array', () => {
            const group: FilterGroup = {
                logic: 'AND',
                conditions: [{ field: 'status', operator: 'in', value: ['todo', 'in_progress'] }],
            };
            expect(buildFilter(group, TEST_FIELDS)).toEqual({
                status: { in: ['todo', 'in_progress'] },
            });
        });

        it('in operator with string value', () => {
            const group: FilterGroup = {
                logic: 'AND',
                conditions: [{ field: 'status', operator: 'in', value: 'todo' }],
            };
            expect(buildFilter(group, TEST_FIELDS)).toEqual({
                status: { in: ['todo'] },
            });
        });

        it('not_in operator', () => {
            const group: FilterGroup = {
                logic: 'AND',
                conditions: [{ field: 'status', operator: 'not_in', value: ['done', 'backlog'] }],
            };
            expect(buildFilter(group, TEST_FIELDS)).toEqual({
                status: { notIn: ['done', 'backlog'] },
            });
        });

        it('after operator', () => {
            const group: FilterGroup = {
                logic: 'AND',
                conditions: [{ field: 'createdAt', operator: 'after', value: '2024-01-01' }],
            };
            expect(buildFilter(group, TEST_FIELDS)).toEqual({
                createdAt: { gt: new Date('2024-01-01') },
            });
        });

        it('before operator', () => {
            const group: FilterGroup = {
                logic: 'AND',
                conditions: [{ field: 'createdAt', operator: 'before', value: '2024-12-31' }],
            };
            expect(buildFilter(group, TEST_FIELDS)).toEqual({
                createdAt: { lt: new Date('2024-12-31') },
            });
        });
    });

    describe('AND/OR logic', () => {
        it('AND with multiple conditions', () => {
            const group: FilterGroup = {
                logic: 'AND',
                conditions: [
                    { field: 'status', operator: 'eq', value: 'todo' },
                    { field: 'priority', operator: 'eq', value: 'high' },
                ],
            };
            expect(buildFilter(group, TEST_FIELDS)).toEqual({
                AND: [
                    { status: 'todo' },
                    { priority: 'high' },
                ],
            });
        });

        it('OR with multiple conditions', () => {
            const group: FilterGroup = {
                logic: 'OR',
                conditions: [
                    { field: 'status', operator: 'eq', value: 'backlog' },
                    { field: 'status', operator: 'eq', value: 'todo' },
                ],
            };
            expect(buildFilter(group, TEST_FIELDS)).toEqual({
                OR: [
                    { status: 'backlog' },
                    { status: 'todo' },
                ],
            });
        });
    });

    describe('unknown fields', () => {
        it('ignores unknown fields', () => {
            const group: FilterGroup = {
                logic: 'AND',
                conditions: [
                    { field: 'unknownField', operator: 'eq', value: 'test' },
                ],
            };
            expect(buildFilter(group, TEST_FIELDS)).toBeUndefined();
        });

        it('filters out unknown fields and returns remaining', () => {
            const group: FilterGroup = {
                logic: 'AND',
                conditions: [
                    { field: 'status', operator: 'eq', value: 'done' },
                    { field: 'unknownField', operator: 'eq', value: 'test' },
                ],
            };
            expect(buildFilter(group, TEST_FIELDS)).toEqual({ status: 'done' });
        });
    });

    describe('mixed valid/invalid conditions', () => {
        it('returns single condition when only one valid', () => {
            const group: FilterGroup = {
                logic: 'AND',
                conditions: [
                    { field: 'status', operator: 'eq', value: 'done' },
                    { field: 'nonexistent', operator: 'eq', value: 'test' },
                ],
            };
            expect(buildFilter(group, TEST_FIELDS)).toEqual({ status: 'done' });
        });
    });
});
