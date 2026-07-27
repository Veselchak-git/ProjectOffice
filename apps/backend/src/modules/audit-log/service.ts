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
import { buildFilter, parseFilterQuery } from "../../shared/lib/filter/index.js";
import type { FieldDefinition } from "../../shared/lib/filter/types.js";
import { Role } from "@/generated/prisma/enums.js";
import { getManagerProjectIds } from "@/shared/lib/project-access/index.js";

import type { AuditLogListResponse } from "./schema.js";
import { getAuditLogListSchema } from "./schema.js";

const AUDIT_LOG_SORT_FIELDS = new Set(["createdAt", "eventType", "subjectType", "objectType"]);

const buildAuditLogOrderBy = (sortBy: string | undefined, sortOrder: string): Record<string, unknown> =>
    buildOrderBy(AUDIT_LOG_SORT_FIELDS, sortBy, sortOrder, { createdAt: "desc" });

function expandEventTypeFilter(where: Record<string, unknown>): Record<string, unknown> {
    const eventType = where.eventType as Record<string, unknown> | undefined;

    if (eventType) {
        if ("in" in eventType) {
            const values = Array.isArray(eventType.in) ? eventType.in : [eventType.in];
            if (values.length === 0) return where;
            if (values.length === 1) {
                return { ...where, eventType: { contains: values[0], mode: "insensitive" } };
            }
            return {
                OR: values.map((v: unknown) => ({ eventType: { contains: v, mode: "insensitive" } })),
            };
        }

        if ("notIn" in eventType) {
            const values = Array.isArray(eventType.notIn) ? eventType.notIn : [eventType.notIn];
            if (values.length === 0) return where;
            if (values.length === 1) {
                return { ...where, eventType: { not: { contains: values[0], mode: "insensitive" } } };
            }
            return {
                AND: values.map((v: unknown) => ({ eventType: { not: { contains: v, mode: "insensitive" } } })),
            };
        }
    }

    // Recurse into AND/OR arrays
    if ("AND" in where && Array.isArray(where.AND)) {
        return { ...where, AND: where.AND.map((child: unknown) =>
            child && typeof child === "object"
                ? expandEventTypeFilter(child as Record<string, unknown>)
                : child,
        ) };
    }
    if ("OR" in where && Array.isArray(where.OR)) {
        return { ...where, OR: where.OR.map((child: unknown) =>
            child && typeof child === "object"
                ? expandEventTypeFilter(child as Record<string, unknown>)
                : child,
        ) };
    }

    return where;
}

export const getAuditLogListService = async (
    request: FastifyRequestTypeBox<typeof getAuditLogListSchema>
): Promise<AuditLogListResponse> => {
    try {
        const prisma = request.server.prisma;
        const { page = 1, perPage = 20, sortBy, sortOrder = "desc", filter } = request.query;

        const orderBy = buildAuditLogOrderBy(sortBy, sortOrder);
        const { skip, take } = paginationArgs(page, perPage);

        const AUDIT_LOG_FILTER_FIELDS: FieldDefinition[] = [
            { field: "eventType", label: "Event Type", type: "enum", enumValues: ["USER_CREATED", "USER_UPDATED", "USER_DELETED", "ISSUE_CREATED", "ISSUE_UPDATED", "ISSUE_DELETED", "PROJECT_CREATED", "PROJECT_UPDATED", "PROJECT_DELETED", "MEMBER_ADDED", "MEMBER_UPDATED", "MEMBER_REMOVED", "CREATE", "UPDATE", "DELETE"] },
            { field: "subjectType", label: "Subject Type", type: "enum", enumValues: ["USER"] },
            { field: "objectType", label: "Object Type", type: "enum", enumValues: ["PROJECT", "ISSUE"] },
            { field: "createdAt", label: "Created At", type: "date" },
        ];

        // Role-based filtering: ADMIN sees all, MANAGER sees only their projects
        const userRole = request.user.role;
        const userId = Number(request.user.sub);

        let allowedProjectIds: number[] | null = null; // null = all (ADMIN)

        if (userRole !== Role.ADMIN) {
            allowedProjectIds = await getManagerProjectIds(prisma, userId);
        }

        // Build role-based where clause
        const roleBasedWhere: Record<string, unknown> = {};

        if (allowedProjectIds !== null) {
            const projectIssues = await prisma.issue.findMany({
                where: {
                    project: { memberships: { some: { userId, role: "MANAGER" } } },
                },
                select: { id: true, projectId: true },
            });
            const issueIds = projectIssues.map(i => i.id);

            roleBasedWhere.OR = [
                { objectType: "PROJECT", objectId: { in: allowedProjectIds } },
                { objectType: "ISSUE", objectId: { in: issueIds } },
            ];
        }

        // Build filter where clause
        const filterQuery = parseFilterQuery(filter);
        const filterWhere = buildFilter(filterQuery, AUDIT_LOG_FILTER_FIELDS);

        // Merge role-based and filter where clauses
        const whereClause: Record<string, unknown> = filterWhere
            ? { AND: [roleBasedWhere, filterWhere] }
            : roleBasedWhere;

        const finalWhere = expandEventTypeFilter(whereClause);

        const [logs, total] = await prisma.$transaction([
            prisma.auditLog.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: {
                    subject: { select: { login: true } },
                },
            }),
            prisma.auditLog.count({ where: finalWhere }),
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
