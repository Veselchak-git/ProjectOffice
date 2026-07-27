/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Type, type Static } from "@fastify/type-provider-typebox";

import type { FilterGroup } from "./types.js";

export const filterQueryStringSchema = Type.Optional(Type.String());

export type FilterQueryString = Static<typeof filterQueryStringSchema>;

export function parseFilterQuery(raw: string | undefined): FilterGroup | undefined {
    if (!raw || raw.trim() === "") {
        return undefined;
    }

    try {
        const parsed = JSON.parse(raw);

        if (
            typeof parsed !== "object" ||
            parsed === null ||
            !Array.isArray(parsed.conditions) ||
            parsed.conditions.length === 0
        ) {
            return undefined;
        }

        if (parsed.logic !== "AND" && parsed.logic !== "OR") {
            return undefined;
        }

        const validOperators = new Set([
            "eq",
            "neq",
            "contains",
            "not_contains",
            "starts_with",
            "in",
            "not_in",
            "after",
            "before",
        ]);

        for (const condition of parsed.conditions) {
            if (
                typeof condition !== "object" ||
                condition === null ||
                typeof condition.field !== "string" ||
                typeof condition.operator !== "string" ||
                !validOperators.has(condition.operator) ||
                (typeof condition.value !== "string" && !Array.isArray(condition.value))
            ) {
                return undefined;
            }
        }

        return parsed as FilterGroup;
    } catch {
        return undefined;
    }
}
