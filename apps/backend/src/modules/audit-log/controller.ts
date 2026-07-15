import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { JWT_DECORATOR_AUTHORIZE } from "@/plugins/jwt-plugin/index.js";
import { Role } from "@/generated/prisma/enums.js";
import { AUDIT_LOG_AVAILABLE_PATH } from "@/shared/routes.js";

import { getAuditLogAvailableSchema } from "./schema.js";

const plugin: FastifyPluginAsyncTypebox = async fastify => {
    fastify.get(
        AUDIT_LOG_AVAILABLE_PATH,
        {
            schema: getAuditLogAvailableSchema,
            preHandler: [fastify.authorize(Role.USER, Role.ADMIN)],
        },
        async request => {
            if (request.user.role === Role.ADMIN) {
                return { available: true };
            }

            const userId = Number(request.user.sub);
            const managerCount = await request.server.prisma.projectMember.count({
                where: { userId, role: "MANAGER" },
            });

            return { available: managerCount > 0 };
        },
    );
};

export const auditLogControllerPlugin = fp(plugin, {
    name: "audit-log-controller",
    decorators: {
        fastify: [JWT_DECORATOR_AUTHORIZE],
    },
});
