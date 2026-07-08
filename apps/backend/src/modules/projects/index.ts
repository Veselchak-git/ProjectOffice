import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { projectsControllerPlugin } from "./controller.js";

const plugin: FastifyPluginAsync = async fastify => {
    await fastify.register(projectsControllerPlugin);
};

export const projectsPlugin = fp(plugin, { name: "projects-plugin" });
