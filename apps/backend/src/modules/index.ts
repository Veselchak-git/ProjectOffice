/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { FastifyPluginAsync } from "fastify";

import { auditLogModulePlugin } from "./audit-log/index.js";
import { authModulePlugin } from "./auth/index.js";
import { issuesPlugin } from "./issues/index.js";
import { pingModulePlugin } from "./ping/index.js";
import { projectsPlugin } from "./projects/index.js";
import { usersPagePlugin } from "./users-page/index.js";

//тут используем без fp т.к. не будет работать префикс
export const modules: FastifyPluginAsync = async fastify => {
    await fastify.register(auditLogModulePlugin);
    await fastify.register(authModulePlugin);
    await fastify.register(issuesPlugin);
    await fastify.register(pingModulePlugin);
    await fastify.register(projectsPlugin);
    await fastify.register(usersPagePlugin);
};
