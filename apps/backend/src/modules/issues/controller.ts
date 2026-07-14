import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE } from "@/plugins/jwt-plugin/index.js";
import { Role } from "@/generated/prisma/enums.js";

import {
    ISSUES_PATH,
    ISSUE_PATH,
    PROJECT_ISSUES_PATH,
} from "@/shared/routes.js";

import {
    getIssuesListSchema,
    getProjectIssuesSchema,
    getIssueByIdSchema,
    createIssueSchema,
    updateIssueSchema,
    deleteIssueSchema,
} from "./schema.js";
import {
    getIssuesListService,
    getProjectIssuesService,
    getIssueByIdService,
    createIssueService,
    updateIssueService,
    deleteIssueService,
} from "./service.js";

const plugin: FastifyPluginAsyncTypebox = async fastify => {
    fastify.get(
        ISSUES_PATH,
        {
            schema: getIssuesListSchema,
            preHandler: [fastify.authorize(Role.USER, Role.ADMIN)],
        },
        getIssuesListService,
    );

    fastify.get(
        ISSUE_PATH,
        {
            schema: getIssueByIdSchema,
            preHandler: [fastify.authorize(Role.USER, Role.ADMIN)],
        },
        getIssueByIdService,
    );

    fastify.get(
        PROJECT_ISSUES_PATH,
        {
            schema: getProjectIssuesSchema,
            preHandler: [fastify.authorize(Role.USER, Role.ADMIN)],
        },
        getProjectIssuesService,
    );

    fastify.post(
        PROJECT_ISSUES_PATH,
        {
            schema: createIssueSchema,
            preHandler: [fastify.authorize(Role.USER, Role.ADMIN)],
        },
        createIssueService,
    );

    fastify.patch(
        ISSUE_PATH,
        {
            schema: updateIssueSchema,
            preHandler: [fastify.authorize(Role.USER, Role.ADMIN)],
        },
        updateIssueService,
    );

    fastify.delete(
        ISSUE_PATH,
        {
            schema: deleteIssueSchema,
            preHandler: [fastify.authorize(Role.USER, Role.ADMIN)],
        },
        deleteIssueService,
    );
};

export const issuesControllerPlugin = fp(plugin, {
    name: "issues-controller",
    decorators: {
        fastify: [JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE],
    },
});
