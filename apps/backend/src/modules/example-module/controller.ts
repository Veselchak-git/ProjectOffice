/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Role } from "@/generated/prisma/client.js";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE } from "@/plugins/jwt-plugin/index.js";

import { EXAMPLE_ADMIN_PATH, EXAMPLE_PROFILE_PATH } from "@/shared/routes.js";

import { getExampleAdminSchema, getExampleProfileSchema } from "./schema.js";
import { getExampleAdminService, getExampleProfileService } from "./service.js";

const plugin: FastifyPluginAsyncTypebox = async fastify => {
    fastify.get(
        EXAMPLE_PROFILE_PATH,
        {
            schema: getExampleProfileSchema,
            preHandler: [fastify.authenticate]
        },
        getExampleProfileService
    );

    fastify.get(
        EXAMPLE_ADMIN_PATH,
        {
            schema: getExampleAdminSchema,
            preHandler: [fastify.authorize(Role.ADMIN)]
        },
        getExampleAdminService
    );
};

export const exampleModuleControllerPlugin = fp(plugin, {
    name: "example-module-controller",
    decorators: {
        fastify: [JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE]
    }
});
