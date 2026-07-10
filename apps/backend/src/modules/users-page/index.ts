import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { usersPageControllerPlugin } from "./controller.js";

const plugin: FastifyPluginAsync = async fastify => {
    await fastify.register(usersPageControllerPlugin);
};

export const usersPagePlugin = fp(plugin, { name: "users-page-plugin" });
