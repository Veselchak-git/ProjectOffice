/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";
import { handlePrismaError } from "@/shared/lib/prisma-error-handler/index.js";
import { buildOrderBy, paginationArgs } from "@/shared/lib/prisma-pagination/index.js";

import type { AuditLogListResponse } from "./schema.js";
import { getAuditLogListSchema } from "./schema.js";

const AUDIT_LOG_SORT_FIELDS = new Set(["createdAt", "eventType", "subjectType", "objectType"]);

const buildAuditLogOrderBy = (sortBy: string | undefined, sortOrder: string): Record<string, unknown> =>
    buildOrderBy(AUDIT_LOG_SORT_FIELDS, sortBy, sortOrder, { createdAt: "desc" });

export const getAuditLogListService = async (
    request: FastifyRequestTypeBox<typeof getAuditLogListSchema>
): Promise<AuditLogListResponse> => {
    try {
        const prisma = request.server.prisma;
        const { page = 1, perPage = 20, sortBy, sortOrder = "desc" } = request.query;

        const orderBy = buildAuditLogOrderBy(sortBy, sortOrder);
        const { skip, take } = paginationArgs(page, perPage);

        const [logs, total] = await prisma.$transaction([
            prisma.auditLog.findMany({
                orderBy,
                skip,
                take,
                include: {
                    subject: { select: { login: true } },
                },
            }),
            prisma.auditLog.count(),
        ]);

        return {
            logs: logs.map(log => ({
                id: log.id,
                eventType: log.eventType,
                subjectType: log.subjectType,
                objectType: log.objectType,
                subjectId: log.subjectId,
                objectId: log.objectId,
                oldValue: log.oldValue,
                newValue: log.newValue,
                subjectLogin: log.subject.login,
                createdAt: log.createdAt.toISOString(),
            })),
            total,
            page,
            perPage,
        };
    } catch (error) {
        throw handlePrismaError(error);
    }
};
