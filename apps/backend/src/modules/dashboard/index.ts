import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { dashboardControllerPlugin } from "./controller.js";

const plugin: FastifyPluginAsync = async fastify => {
    await fastify.register(dashboardControllerPlugin);
};

export const dashboardPlugin = fp(plugin, { name: "dashboard-plugin" });
