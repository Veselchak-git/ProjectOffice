import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { JWT_DECORATOR_AUTHORIZE } from "@/plugins/jwt-plugin/index.js";
import type { JwtPayload } from "@/plugins/jwt-plugin/model.js";
import { Role } from "@/generated/prisma/enums.js";
import { AUDIT_LOG_AVAILABLE_PATH, AUDIT_LOG_PATH, AUDIT_LOG_STREAM_PATH } from "@/shared/routes.js";

import { auditLogEmitter } from "./emitter.js";
import {
    getAuditLogAvailableSchema,
    getAuditLogListSchema,
    getAuditLogStreamSchema,
} from "./schema.js";
import { getAuditLogListService } from "./service.js";

function writeJsonError(raw: import("http").ServerResponse, statusCode: number, message: string) {
    raw.writeHead(statusCode, { "Content-Type": "application/json" });
    raw.write(JSON.stringify({ error: message }));
    raw.end();
}

const plugin: FastifyPluginAsyncTypebox = async fastify => {
    // Existing endpoint: GET /audit-log/available
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

    // New endpoint: GET /audit-log (list with pagination and sorting)
    fastify.get(
        AUDIT_LOG_PATH,
        {
            schema: getAuditLogListSchema,
            preHandler: [fastify.authorize(Role.USER, Role.ADMIN)],
        },
        getAuditLogListService,
    );

    // New endpoint: GET /audit-log/stream (SSE)
    fastify.get(
        AUDIT_LOG_STREAM_PATH,
        {
            schema: getAuditLogStreamSchema,
        },
        async (request, reply) => {
            // Manual JWT verification from query param (EventSource can't send headers)
            const token = (request.query as Record<string, string>)?.token;
            if (!token) {
                writeJsonError(reply.raw, 401, "Missing token");
                return;
            }
            let user: JwtPayload;
            try {
                user = fastify.jwt.verify<JwtPayload>(token);
            } catch {
                writeJsonError(reply.raw, 401, "Invalid token");
                return;
            }
            if (user.role !== Role.ADMIN) {
                // Non-admin users must be MANAGER in at least one project
                const userId = Number(user.sub);
                const managerCount = await fastify.prisma.projectMember.count({
                    where: { userId, role: "MANAGER" },
                });
                if (managerCount === 0) {
                    writeJsonError(reply.raw, 403, "Forbidden");
                    return;
                }
            }

            // Set SSE headers
            reply.raw.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            });

            // Send initial connected event
            const writeEvent = (data: Record<string, unknown>) => {
                reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
            };

            writeEvent({ type: "connected", message: "SSE connection established" });

            // Heartbeat every 30 seconds
            const heartbeatInterval = setInterval(() => {
                reply.raw.write(": heartbeat\n\n");
            }, 30_000);

            // Subscribe to audit log events from the emitter
            const eventHandler = (data: Record<string, unknown>) => {
                writeEvent({ type: "audit-log", ...data });
            };
            auditLogEmitter.on("audit-log", eventHandler);

            // Handle client disconnect
            request.raw.on("close", () => {
                auditLogEmitter.off("audit-log", eventHandler);
                clearInterval(heartbeatInterval);
            });
        },
    );
};

export const auditLogControllerPlugin = fp(plugin, {
    name: "audit-log-controller",
    decorators: {
        fastify: [JWT_DECORATOR_AUTHORIZE],
    },
});
