/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Type } from "@fastify/type-provider-typebox";

export const envSchema = Type.Object({
    NODE_ENV: Type.String({ default: "development" }),
    PORT: Type.Number({ default: 8442 }),
    HOST: Type.String({ default: "0.0.0.0" }),
    DATABASE_URL: Type.String({ default: "postgresql://postgres:postgres@localhost:5432/helpdesk_portal" }),
    JWT_ACCESS_SECRET: Type.String({ default: "dev-access-secret-change-me" }),
    JWT_ACCESS_TTL: Type.String({ default: "15m" }),
    REFRESH_TOKEN_SECRET: Type.String({ default: "dev-refresh-secret-change-me" }),
    REFRESH_TOKEN_TTL: Type.String({ default: "7d" }),
    SALT_SECRET: Type.String({ default: "dev-salt-secret-change-me" })
});
