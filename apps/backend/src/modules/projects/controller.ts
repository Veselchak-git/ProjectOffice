import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE } from "@/plugins/jwt-plugin/index.js";
import { Role } from "@/generated/prisma/enums.js";

import {
    PROJECTS_LIST_PATH,
    PROJECT_PATH,
    PROJECT_MEMBERS_PATH,
    PROJECT_MEMBER_PATH,
    USERS_PATH,
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
    getUsersService,
    getProjectMembersService,
    addProjectMemberService,
    updateProjectMemberService,
    removeProjectMemberService,
    deleteProjectService,
} from "./service.js";

const plugin: FastifyPluginAsyncTypebox = async fastify => {
    fastify.get(
        PROJECTS_LIST_PATH,
        {
            schema: getProjectsListSchema,
            preHandler: [fastify.authenticate],
        },
        getProjectsListService,
    );

    fastify.get(
        PROJECT_PATH,
        {
            schema: getProjectByIdSchema,
            preHandler: [fastify.authenticate],
        },
        getProjectByIdService,
    );

    fastify.post(
        PROJECTS_LIST_PATH,
        {
            schema: createProjectSchema,
            preHandler: [fastify.authenticate],
        },
        createProjectService,
    );

    fastify.patch(
        PROJECT_PATH,
        {
            schema: updateProjectSchema,
            preHandler: [fastify.authenticate],
        },
        updateProjectService,
    );

    fastify.get(
        USERS_PATH,
        {
            preHandler: [fastify.authenticate],
        },
        getUsersService,
    );

    fastify.get(
        PROJECT_MEMBERS_PATH,
        {
            schema: getProjectMembersSchema,
            preHandler: [fastify.authenticate],
        },
        getProjectMembersService,
    );

    fastify.post(
        PROJECT_MEMBERS_PATH,
        {
            schema: addProjectMemberSchema,
            preHandler: [fastify.authenticate],
        },
        addProjectMemberService,
    );

    fastify.patch(
        PROJECT_MEMBER_PATH,
        {
            schema: updateProjectMemberSchema,
            preHandler: [fastify.authenticate],
        },
        updateProjectMemberService,
    );

    fastify.delete(
        PROJECT_MEMBER_PATH,
        {
            schema: deleteProjectMemberSchema,
            preHandler: [fastify.authenticate],
        },
        removeProjectMemberService,
    );

    fastify.delete(
        PROJECT_PATH,
        {
            schema: deleteProjectSchema,
            preHandler: [fastify.authorize(Role.ADMIN)],
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
