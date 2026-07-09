/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { Static } from "@fastify/type-provider-typebox";
import { TypeBoxValidatorCompiler } from "@fastify/type-provider-typebox";
import Fastify from "fastify";

import { envSchema } from "@/plugins/env-plugin/schema.js";

import type { FastifyTypeBox } from "@/shared/lib/typebox/types.js";

type TestAppConfig = Static<typeof envSchema>;

const defaultTestConfig = {
    PORT: 8442,
    HOST: "0.0.0.0",
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/office_registry",
    JWT_ACCESS_SECRET: "test-access-secret",
    JWT_ACCESS_TTL: "15m",
    REFRESH_TOKEN_SECRET: "test-refresh-secret",
    REFRESH_TOKEN_TTL: "7d",
    SALT_SECRET: "test-salt-secret"
} satisfies TestAppConfig;

type DefaultBuildTestAppOptions = {
    config?: Partial<TestAppConfig>;
};

export const defaultBuildTestApp = ({ config }: DefaultBuildTestAppOptions = {}): FastifyTypeBox => {
    const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).withTypeProvider();

    fastify.decorate("config", {
        ...defaultTestConfig,
        ...config
    });

    return fastify;
};
