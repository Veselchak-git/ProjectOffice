/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { type Static, Type } from "@fastify/type-provider-typebox";

export const pingSearchParamsSchema = Type.Object({
    name: Type.String()
});

export type PingSearchParamsSchema = Static<typeof pingSearchParamsSchema>;

export const pingResponseSchema = Type.Object({
    message: Type.String()
});

export type PingResponseSchema = Static<typeof pingResponseSchema>;

export const getPingSchema = {
    querystring: pingSearchParamsSchema,
    response: {
        200: pingResponseSchema
    }
};
