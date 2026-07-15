/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Type } from "@fastify/type-provider-typebox";

export interface PaginationQueryDefaults {
    sortBy?: string;
    sortOrder?: string;
}

export function createPaginationQueryFields(defaults: PaginationQueryDefaults = {}) {
    return {
        q: Type.Optional(Type.String()),
        page: Type.Optional(Type.Number({ default: 1 })),
        perPage: Type.Optional(Type.Number({ default: 20 })),
        sortBy: Type.Optional(Type.String(defaults.sortBy !== undefined ? { default: defaults.sortBy } : {})),
        sortOrder: Type.Optional(
            Type.String(defaults.sortOrder !== undefined ? { default: defaults.sortOrder } : {}),
        ),
    };
}

export function createPaginationQuerySchema(defaults: PaginationQueryDefaults = {}) {
    return Type.Object(createPaginationQueryFields(defaults));
}

export const paginationQuerySchema = createPaginationQuerySchema({
    sortBy: "createdAt",
    sortOrder: "desc",
});
