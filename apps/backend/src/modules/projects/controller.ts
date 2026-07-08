import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { JWT_DECORATOR_AUTHENTICATE } from "@/plugins/jwt-plugin/index.js";

import { PROJECTS_LIST_PATH } from "@/shared/routes.js";

import { getProjectsListSchema } from "./schema.js";
import { getProjectsListService } from "./service.js";

const plugin: FastifyPluginAsyncTypebox = async fastify => {
    fastify.get(
        PROJECTS_LIST_PATH,
        {
            schema: getProjectsListSchema,
            preHandler: [fastify.authenticate],
        },
        getProjectsListService,
    );
};

export const projectsControllerPlugin = fp(plugin, {
    name: "projects-controller",
    decorators: {
        fastify: [JWT_DECORATOR_AUTHENTICATE],
    },
});
