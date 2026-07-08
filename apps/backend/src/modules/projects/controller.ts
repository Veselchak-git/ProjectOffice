import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { JWT_DECORATOR_AUTHENTICATE } from "@/plugins/jwt-plugin/index.js";

import { PROJECTS_LIST_PATH, PROJECT_PATH } from "@/shared/routes.js";

import {
    getProjectsListSchema,
    getProjectByIdSchema,
    createProjectSchema,
    updateProjectSchema,
} from "./schema.js";
import {
    getProjectsListService,
    getProjectByIdService,
    createProjectService,
    updateProjectService,
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
};

export const projectsControllerPlugin = fp(plugin, {
    name: "projects-controller",
    decorators: {
        fastify: [JWT_DECORATOR_AUTHENTICATE],
    },
});
