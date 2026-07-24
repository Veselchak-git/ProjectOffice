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
import { Role } from "@/generated/prisma/enums.js";
import { getManagerProjectIds } from "@/shared/lib/project-access/index.js";

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

        // Role-based filtering: ADMIN sees all, MANAGER sees only their projects
        const userRole = request.user.role;
        const userId = Number(request.user.sub);

        let allowedProjectIds: number[] | null = null; // null = all (ADMIN)

        if (userRole !== Role.ADMIN) {
            allowedProjectIds = await getManagerProjectIds(prisma, userId);
        }

        // Build where clause for filtering
        const whereClause: Record<string, unknown> = {};

        if (allowedProjectIds !== null) {
            // MANAGER: filter by project and issue membership in one query
            const projectIssues = await prisma.issue.findMany({
                where: {
                    project: { memberships: { some: { userId, role: "MANAGER" } } },
                },
                select: { id: true, projectId: true },
            });
            const issueIds = projectIssues.map(i => i.id);

            whereClause.OR = [
                { objectType: "PROJECT", objectId: { in: allowedProjectIds } },
                { objectType: "ISSUE", objectId: { in: issueIds } },
            ];
        }

        const [logs, total] = await prisma.$transaction([
            prisma.auditLog.findMany({
                where: whereClause,
                orderBy,
                skip,
                take,
                include: {
                    subject: { select: { login: true } },
                },
            }),
            prisma.auditLog.count({ where: whereClause }),
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
