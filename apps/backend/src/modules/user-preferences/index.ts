import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { userPreferencesControllerPlugin } from "./controller.js";

const plugin: FastifyPluginAsync = async fastify => {
    await fastify.register(userPreferencesControllerPlugin);
};

export const userPreferencesPlugin = fp(plugin, { name: "user-preferences-plugin" });
