/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { pingControllerPlugin } from "./controller.js";

const plugin: FastifyPluginAsync = async fastify => {
    await fastify.register(pingControllerPlugin);
};

export const pingModulePlugin = fp(plugin, { name: "ping-module-plugin" });
