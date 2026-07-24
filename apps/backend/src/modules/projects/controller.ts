import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE } from "@/plugins/jwt-plugin/index.js";
import { Role } from "@/generated/prisma/enums.js";
import { createProjectAccessGuard } from "@/shared/lib/project-access/index.js";

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

import { ProjectMemberRole } from "@/generated/prisma/enums.js";

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
                createProjectAccessGuard({ allowGlobalAdmin: true }),
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
                fastify.authorize(Role.USER, Role.ADMIN),
                createProjectAccessGuard({
                    requiredRoles: [ProjectMemberRole.MANAGER],
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
                createProjectAccessGuard({ allowGlobalAdmin: true }),
            ],
        },
        getProjectMembersService,
    );

    fastify.post(
        PROJECT_MEMBERS_PATH,
        {
            schema: addProjectMemberSchema,
            preHandler: [
                fastify.authorize(Role.USER, Role.ADMIN),
                createProjectAccessGuard({
                    requiredRoles: [ProjectMemberRole.MANAGER],
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
                fastify.authorize(Role.USER, Role.ADMIN),
                createProjectAccessGuard({
                    requiredRoles: [ProjectMemberRole.MANAGER],
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
                fastify.authorize(Role.USER, Role.ADMIN),
                createProjectAccessGuard({
                    requiredRoles: [ProjectMemberRole.MANAGER],
                    allowGlobalAdmin: true,
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
                fastify.authorize(Role.USER, Role.ADMIN),
                createProjectAccessGuard({
                    requiredRoles: [ProjectMemberRole.MANAGER],
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
