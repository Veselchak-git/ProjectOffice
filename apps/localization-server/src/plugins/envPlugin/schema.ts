/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Type, type Static } from "@fastify/type-provider-typebox";

export const envSchema = Type.Object({
    PORT: Type.Optional(Type.Number({ default: 3001 })),
    HOST: Type.Optional(Type.String({ default: "0.0.0.0" })),
    NODE_ENV: Type.Optional(Type.String({ default: "development" })),
});

export type Env = Static<typeof envSchema>;
