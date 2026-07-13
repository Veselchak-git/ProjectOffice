import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { preHandlerHookHandler } from "fastify";
import fp from "fastify-plugin";

import { JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE } from "@/plugins/jwt-plugin/index.js";
import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";
import { Role } from "@/generated/prisma/enums.js";

import {
    PROJECTS_LIST_PATH,
    PROJECT_PATH,
    PROJECT_MEMBERS_PATH,
    PROJECT_MEMBER_PATH,
} from "@/shared/routes.js";

import {
    getProjectsListSchema,
    getProjectByIdSchema,
    createProjectSchema,
    updateProjectSchema,
    getProjectMembersSchema,
    addProjectMemberSchema,
    updateProjectMemberSchema,
    deleteProjectMemberSchema,
    deleteProjectSchema,
} from "./schema.js";
import {
    getProjectsListService,
    getProjectByIdService,
    createProjectService,
    updateProjectService,
    getProjectMembersService,
    addProjectMemberService,
    updateProjectMemberService,
    removeProjectMemberService,
    deleteProjectService,
} from "./service.js";

const ROLE_HIERARCHY: Record<string, number> = {
    VIEWER: 0,
    REPORTER: 1,
    UPDATER: 2,
    DEVELOPER: 3,
    MANAGER: 4,
};

interface CheckProjectAccessOptions {
    requireProjectRoles?: string[];
    allowGlobalAdmin?: boolean;
    checkSelfModification?: boolean;
    checkRoleHierarchy?: boolean;
}

const checkProjectAccess = (options: CheckProjectAccessOptions): preHandlerHookHandler => {
    return async request => {
        const params = request.params as Record<string, unknown>;

        if (options.checkSelfModification) {
            const targetUserId = params.userId != null ? Number(params.userId) : undefined;
            if (targetUserId !== undefined && targetUserId === Number(request.user.sub)) {
                throw new AppError(HTTP_STATUS.FORBIDDEN, "Нельзя менять свои права", "SELF_ROLE_CHANGE");
            }
        }

        if (options.allowGlobalAdmin && request.user.role === Role.ADMIN) return;

        if (options.checkRoleHierarchy) {
            const targetRole = (request.body as Record<string, unknown>).role as string | undefined;
            if (targetRole) {
                const projectId = Number(params.id);
                const userId = Number(request.user.sub);

                const member = await request.server.prisma.projectMember.findUnique({
                    where: { userId_projectId: { userId, projectId } },
                });

                if (!member) {
                    throw new AppError(HTTP_STATUS.FORBIDDEN, "Доступ запрещён", "AUTH_FORBIDDEN");
                }

                const actorRank = ROLE_HIERARCHY[member.role] ?? 0;
                const targetRank = ROLE_HIERARCHY[targetRole] ?? 0;
                if (targetRank > actorRank) {
                    throw new AppError(HTTP_STATUS.FORBIDDEN, "Нельзя назначить роль выше своей", "ROLE_HIERARCHY");
                }
            }
        }

        const projectId = Number(params.id);
        const userId = Number(request.user.sub);

        const member = await request.server.prisma.projectMember.findUnique({
            where: { userId_projectId: { userId, projectId } },
        });

        if (!member) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, "Доступ запрещён", "AUTH_FORBIDDEN");
        }

        if (options.requireProjectRoles && !options.requireProjectRoles.includes(member.role)) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, "Доступ запрещён", "AUTH_FORBIDDEN");
        }
    };
};

const plugin: FastifyPluginAsyncTypebox = async fastify => {
    fastify.get(
        PROJECTS_LIST_PATH,
        {
            schema: getProjectsListSchema,
            preHandler: [fastify.authorize(Role.USER, Role.ADMIN)],
        },
        getProjectsListService,
    );

    fastify.get(
        PROJECT_PATH,
        {
            schema: getProjectByIdSchema,
            preHandler: [
                fastify.authorize(Role.USER, Role.ADMIN),
                checkProjectAccess({ allowGlobalAdmin: true }),
            ],
        },
        getProjectByIdService,
    );

    fastify.post(
        PROJECTS_LIST_PATH,
        {
            schema: createProjectSchema,
            preHandler: [fastify.authorize(Role.USER, Role.ADMIN)],
        },
        createProjectService,
    );

    fastify.patch(
        PROJECT_PATH,
        {
            schema: updateProjectSchema,
            preHandler: [
                fastify.authenticate,
                checkProjectAccess({
                    requireProjectRoles: ["MANAGER"],
                    allowGlobalAdmin: true,
                }),
            ],
        },
        updateProjectService,
    );

    fastify.get(
        PROJECT_MEMBERS_PATH,
        {
            schema: getProjectMembersSchema,
            preHandler: [
                fastify.authorize(Role.USER, Role.ADMIN),
                checkProjectAccess({ allowGlobalAdmin: true }),
            ],
        },
        getProjectMembersService,
    );

    fastify.post(
        PROJECT_MEMBERS_PATH,
        {
            schema: addProjectMemberSchema,
            preHandler: [
                fastify.authenticate,
                checkProjectAccess({
                    requireProjectRoles: ["MANAGER"],
                    allowGlobalAdmin: true,
                    checkRoleHierarchy: true,
                }),
            ],
        },
        addProjectMemberService,
    );

    fastify.patch(
        PROJECT_MEMBER_PATH,
        {
            schema: updateProjectMemberSchema,
            preHandler: [
                fastify.authenticate,
                checkProjectAccess({
                    requireProjectRoles: ["MANAGER"],
                    allowGlobalAdmin: true,
                    checkSelfModification: true,
                    checkRoleHierarchy: true,
                }),
            ],
        },
        updateProjectMemberService,
    );

    fastify.delete(
        PROJECT_MEMBER_PATH,
        {
            schema: deleteProjectMemberSchema,
            preHandler: [
                fastify.authenticate,
                checkProjectAccess({
                    requireProjectRoles: ["MANAGER"],
                    allowGlobalAdmin: true,
                    checkSelfModification: true,
                }),
            ],
        },
        removeProjectMemberService,
    );

    fastify.delete(
        PROJECT_PATH,
        {
            schema: deleteProjectSchema,
            preHandler: [
                fastify.authenticate,
                checkProjectAccess({
                    requireProjectRoles: ["MANAGER"],
                    allowGlobalAdmin: true,
                }),
            ],
        },
        deleteProjectService,
    );
};

export const projectsControllerPlugin = fp(plugin, {
    name: "projects-controller",
    decorators: {
        fastify: [JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE],
    },
});
