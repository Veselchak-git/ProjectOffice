import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE } from "@/plugins/jwt-plugin/index.js";
import { Role } from "@/generated/prisma/enums.js";
import { DASHBOARD_PATH } from "@/shared/routes.js";

import { getDashboardSchema } from "./schema.js";
import { getDashboardService } from "./service.js";

const plugin: FastifyPluginAsyncTypebox = async fastify => {
    fastify.get(
        DASHBOARD_PATH,
        {
            schema: getDashboardSchema,
            preHandler: [fastify.authorize(Role.USER, Role.ADMIN)],
        },
        getDashboardService,
    );
};

export const dashboardControllerPlugin = fp(plugin, {
    name: "dashboard-controller",
    decorators: {
        fastify: [JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE],
    },
});
