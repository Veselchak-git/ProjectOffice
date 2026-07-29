import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { JWT_DECORATOR_AUTHORIZE } from "@/plugins/jwt-plugin/index.js";
import type { JwtPayload } from "@/plugins/jwt-plugin/model.js";
import { Role } from "@/generated/prisma/enums.js";
import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";
import { getManagerProjectIds } from "@/shared/lib/project-access/index.js";
import { AUDIT_LOG_AVAILABLE_PATH, AUDIT_LOG_PATH, AUDIT_LOG_STREAM_PATH, AUDIT_LOG_EXPORT_PATH } from "@/shared/routes.js";

import { auditLogEmitter } from "./emitter.js";
import type { EntityChangeEvent } from "./emitter.js";
import {
    getAuditLogAvailableSchema,
    getAuditLogExportSchema,
    getAuditLogListSchema,
    getAuditLogStreamSchema,
} from "./schema.js";
import { getAuditLogExportService, getAuditLogListService } from "./service.js";

function writeJsonError(raw: import("http").ServerResponse, statusCode: number, message: string) {
    raw.writeHead(statusCode, { "Content-Type": "application/json" });
    raw.write(JSON.stringify({ error: message }));
    raw.end();
}

function createEntityHandler(
    allowedProjectIds: number[] | null,
    eventType: string,
    writeEvent: (data: Record<string, unknown>) => void,
) {
    return (data: Record<string, unknown>) => {
        if (allowedProjectIds === null) {
            writeEvent({ type: eventType, ...data });
            return;
        }
        const event = data as unknown as EntityChangeEvent;
        if (event.projectId && allowedProjectIds.includes(event.projectId)) {
            writeEvent({ type: eventType, ...data });
        }
    };
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

    // Endpoint: GET /audit-log (list with pagination and sorting)
    fastify.get(
        AUDIT_LOG_PATH,
        {
            schema: getAuditLogListSchema,
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
        getAuditLogListService,
    );

    // Endpoint: GET /audit-log/export (export all matching logs without pagination)
    fastify.get(
        AUDIT_LOG_EXPORT_PATH,
        {
            schema: getAuditLogExportSchema,
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
        getAuditLogExportService,
    );

    // New endpoint: GET /audit-log/stream (SSE)
    fastify.get(
        AUDIT_LOG_STREAM_PATH,
        {
            schema: getAuditLogStreamSchema,
        },
        async (request, reply) => {
            // Authenticate via Authorization: Bearer <JWT> header
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                writeJsonError(reply.raw, 401, "Missing or invalid Authorization header");
                return;
            }

            const token = authHeader.slice(7);
            let user: JwtPayload;
            try {
                user = await request.server.jwt.verify<JwtPayload>(token);
            } catch {
                writeJsonError(reply.raw, 401, "Invalid or expired JWT token");
                return;
            }

            // Determine allowed projects based on role
            let allowedProjectIds: number[] | null = null; // null = all (ADMIN)
            if (user.role !== Role.ADMIN) {
                const userId = Number(user.sub);
                allowedProjectIds = await getManagerProjectIds(fastify.prisma, userId);
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

            // Subscribe to events with role-based filtering
            const auditLogHandler = (data: Record<string, unknown>) => {
                writeEvent({ type: "audit-log", ...data });
            };

            const usersChangeHandler = createEntityHandler(allowedProjectIds, "users:change", writeEvent);
            const projectsChangeHandler = createEntityHandler(allowedProjectIds, "projects:change", writeEvent);
            const issuesChangeHandler = createEntityHandler(allowedProjectIds, "issues:change", writeEvent);

            auditLogEmitter.on("audit-log", auditLogHandler);
            auditLogEmitter.on("users:change", usersChangeHandler);
            auditLogEmitter.on("projects:change", projectsChangeHandler);
            auditLogEmitter.on("issues:change", issuesChangeHandler);

            // Handle client disconnect
            request.raw.on("close", () => {
                auditLogEmitter.off("audit-log", auditLogHandler);
                auditLogEmitter.off("users:change", usersChangeHandler);
                auditLogEmitter.off("projects:change", projectsChangeHandler);
                auditLogEmitter.off("issues:change", issuesChangeHandler);
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
