import { Role } from "@/generated/prisma/client.js";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE } from "@/plugins/jwt-plugin/index.js";
import { USER_PATH, USERS_PATH } from "@/shared/routes.js";

import { createUserSchema, deleteUserSchema, getUsersSchema, updateUserSchema } from "./schema.js";
import { createUserService, deleteUserService, getUsersService, updateUserService } from "./service.js";

const plugin: FastifyPluginAsyncTypebox = async fastify => {
    fastify.get(
        USERS_PATH,
        {
            schema: getUsersSchema,
            preHandler: [fastify.authenticate],
        },
        getUsersService,
    );

    fastify.post(
        USERS_PATH,
        {
            schema: createUserSchema,
            preHandler: [fastify.authorize(Role.ADMIN)],
        },
        createUserService,
    );

    fastify.patch(
        USER_PATH,
        {
            schema: updateUserSchema,
            preHandler: [fastify.authorize(Role.ADMIN)],
        },
        updateUserService,
    );

    fastify.delete(
        USER_PATH,
        {
            schema: deleteUserSchema,
            preHandler: [fastify.authorize(Role.ADMIN)],
        },
        deleteUserService,
    );
};

export const usersPageControllerPlugin = fp(plugin, {
    name: "users-page-controller",
    decorators: {
        fastify: [JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE],
    },
});
