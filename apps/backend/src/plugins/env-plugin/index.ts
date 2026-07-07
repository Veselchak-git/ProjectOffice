/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import fastifyEnv from "@fastify/env";
import type { Static } from "@fastify/type-provider-typebox";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { envSchema } from "./schema.js";

export const ENV_PLUGIN_NAME = "env";
export const ENV_DECORATOR_NAME = "config";
const plugin: FastifyPluginAsync = async fastify => {
    await fastify.register(fastifyEnv, {
        confKey: ENV_DECORATOR_NAME,
        schema: envSchema,
        dotenv: true
    });
};

export const envPlugin = fp(plugin, { name: ENV_PLUGIN_NAME });
declare module "fastify" {
    interface FastifyInstance {
        [ENV_DECORATOR_NAME]: Static<typeof envSchema>;
    }
}
