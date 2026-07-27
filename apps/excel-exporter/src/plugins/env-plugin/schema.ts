/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Type, type Static } from "@fastify/type-provider-typebox";

export const envSchema = Type.Object({
    PORT: Type.Number({ default: 3003 }),
    HOST: Type.String({ default: "0.0.0.0" }),
    NODE_ENV: Type.String({ default: "development" }),
    BACKEND_URL: Type.String({ default: "http://localhost:8442" }),
});

export type Env = Static<typeof envSchema>;
