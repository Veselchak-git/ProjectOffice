import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { issuesControllerPlugin } from "./controller.js";

const plugin: FastifyPluginAsync = async fastify => {
    await fastify.register(issuesControllerPlugin);
};

export const issuesPlugin = fp(plugin, { name: "issues-plugin" });
