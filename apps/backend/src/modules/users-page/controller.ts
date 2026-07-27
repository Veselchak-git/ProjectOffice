import { Role } from "@/generated/prisma/client.js";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE } from "@/plugins/jwt-plugin/index.js";
import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";
import { USER_PATH, USERS_EXPORT_PATH, USERS_PATH } from "@/shared/routes.js";

import { createUserSchema, deleteUserSchema, getUsersExportSchema, getUsersSchema, updateUserSchema } from "./schema.js";
import { createUserService, deleteUserService, getUsersExportService, getUsersService, updateUserService } from "./service.js";

const plugin: FastifyPluginAsyncTypebox = async fastify => {
    fastify.get(
        USERS_PATH,
        {
            schema: getUsersSchema,
            preHandler: [
                fastify.authorize(Role.USER, Role.ADMIN),
                async request => {
                    if (request.user.role === Role.ADMIN) return;
                    const userId = Number(request.user.sub);
                    const isManager = await request.server.prisma.projectMember.count({
                        where: { userId, role: "MANAGER" },
                    });
                    if (isManager === 0) {
                        throw new AppError(HTTP_STATUS.FORBIDDEN, "Forbidden", "AUTH_FORBIDDEN");
                    }
                },
            ],
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

    fastify.get(
        USERS_EXPORT_PATH,
        {
            schema: getUsersExportSchema,
            preHandler: [fastify.authorize(Role.USER, Role.ADMIN)],
        },
        getUsersExportService,
    );
};

export const usersPageControllerPlugin = fp(plugin, {
    name: "users-page-controller",
    decorators: {
        fastify: [JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE],
    },
});
