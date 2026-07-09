/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import fastifyCookie from "@fastify/cookie";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

export const COOKIE_PLUGIN_NAME = "cookiePlugin";

const plugin: FastifyPluginAsync = async fastify => {
    await fastify.register(fastifyCookie);
};

export const cookiePlugin = fp(plugin, { name: COOKIE_PLUGIN_NAME });
