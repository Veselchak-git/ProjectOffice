import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { auditLogControllerPlugin } from "./controller.js";

const plugin: FastifyPluginAsync = async fastify => {
    await fastify.register(auditLogControllerPlugin);
};

export const auditLogModulePlugin = fp(plugin, { name: "audit-log-module-plugin" });
