import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { Role } from "@/generated/prisma/client.js";
import { JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE } from "@/plugins/jwt-plugin/index.js";
import { USER_PREFERENCES_PATH } from "./routes.js";
import { getPreferencesSchema, putPreferencesSchema } from "./schema.js";
import { getPreferencesService, putPreferencesService } from "./service.js";

const plugin: FastifyPluginAsyncTypebox = async fastify => {
    fastify.get(
        USER_PREFERENCES_PATH,
        {
            schema: getPreferencesSchema,
            preHandler: [fastify.authorize(Role.USER, Role.ADMIN)],
        },
        getPreferencesService,
    );

    fastify.put(
        USER_PREFERENCES_PATH,
        {
            schema: putPreferencesSchema,
            preHandler: [fastify.authorize(Role.USER, Role.ADMIN)],
        },
        putPreferencesService,
    );
};

export const userPreferencesControllerPlugin = fp(plugin, {
    name: "user-preferences-controller",
    decorators: {
        fastify: [JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE],
    },
});
