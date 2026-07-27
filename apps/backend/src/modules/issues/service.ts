/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

import type { PrismaClient } from "@/generated/prisma/client.js";
import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";
import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";
import { buildOrderBy, paginationArgs } from "@/shared/lib/prisma-pagination/index.js";
import { resolveProjectAccess } from "@/shared/lib/project-access/index.js";
import { assertValidAssignee } from "@/shared/lib/validate-assignee/index.js";
import { buildFilter, parseFilterQuery } from "@/shared/lib/filter/index.js";
import type { FieldDefinition } from "@/shared/lib/filter/types.js";
import {
    IssueCategory,
    IssuePriority,
    IssueStatus,
    ProjectMemberRole,
    Reproducibility,
    Role,
} from "@/generated/prisma/enums.js";
import { auditLogEmitter } from "@/modules/audit-log/emitter.js";


import type {
    IssueListResponse,
    IssueResponse,
} from "./schema.js";

import {
    createIssueSchema,
    deleteIssueSchema,
    getIssueByIdSchema,
    getIssuesExportSchema,
    getIssuesListSchema,
    getProjectIssuesSchema,
    updateIssueSchema,
} from "./schema.js";

export type IssueRow = {
    id: number;
    title: string;
    projectId: number;
    category: IssueCategory;
    priority: IssuePriority;
    reproducibility: Reproducibility | null;
    productVersionId: number | null;
    description: string | null;
    additionalInfo: string | null;
    status: IssueStatus;
    assigneeId: number | null;
    reporterId: number;
    solution: string | null;
    createdAt: Date;
    updatedAt: Date;
    project: { name: string };
    productVersion: { version: string } | null;
    assignee: { login: string } | null;
    reporter: { login: string };
};

export const mapIssue = (i: IssueRow, myRole?: string | null): IssueResponse => ({
    id: i.id,
    title: i.title,
    projectId: i.projectId,
    projectName: i.project.name,
    category: i.category,
    priority: i.priority,
    reproducibility: i.reproducibility,
    productVersionId: i.productVersionId,
    productVersion: i.productVersion?.version ?? null,
    description: i.description,
    additionalInfo: i.additionalInfo,
    status: i.status,
    assigneeId: i.assigneeId,
    assigneeLogin: i.assignee?.login ?? null,
    reporterId: i.reporterId,
    reporterLogin: i.reporter.login,
    solution: i.solution,
    ...(myRole != null ? { myRole } : {}),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
});

const ISSUE_SORT_FIELDS = new Set(["title", "status", "priority", "category", "createdAt", "updatedAt", "assigneeLogin", "projectName"]);

const buildIssueOrderBy = (sortBy: string | undefined, sortOrder: string): Record<string, unknown> =>
    buildOrderBy(ISSUE_SORT_FIELDS, sortBy, sortOrder, { createdAt: "desc" }, {
        assigneeLogin: (order: string) => ({ assignee: { login: order } }),
        projectName: (order: string) => ({ project: { name: order } }),
    });

const include = {
    project: { select: { name: true } },
    productVersion: { select: { version: true } },
    assignee: { select: { login: true } },
    reporter: { select: { login: true } },
} as const;

const getIssueOrThrow = async (prisma: PrismaClient, id: number): Promise<IssueRow> => {
    const issue = await prisma.issue.findUnique({
        where: { id },
        include,
    });
    if (!issue) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, "Issue not found", "ISSUE_NOT_FOUND");
    }
    return issue as unknown as IssueRow;
};

export const getIssuesListService = async (
    request: FastifyRequestTypeBox<typeof getIssuesListSchema>
): Promise<IssueListResponse> => {
    const prisma = request.server.prisma;
    const { page = 1, perPage = 20, sortBy, sortOrder = "desc", filter } = request.query;

    const userId = Number(request.user.sub);
    const userRole = request.user.role;

    const roleBasedWhere: Record<string, unknown> = {};

    if (userRole === Role.ADMIN) {
        // ADMIN sees all issues
    } else {
        const userProjects = await prisma.projectMember.findMany({
            where: { userId },
            select: { projectId: true },
        });

        const projectIds = userProjects.map(up => up.projectId);
        roleBasedWhere.OR = [
            { assigneeId: userId },
            ...(projectIds.length > 0 ? [{ projectId: { in: projectIds } }] : []),
        ];
    }

    const filterFields: FieldDefinition[] = [
        { field: "title", type: "text", label: "Title" },
        { field: "status", type: "enum", enumValues: Object.values(IssueStatus), label: "Status" },
        { field: "priority", type: "enum", enumValues: Object.values(IssuePriority), label: "Priority" },
        { field: "category", type: "enum", enumValues: Object.values(IssueCategory), label: "Category" },
        { field: "createdAt", type: "date", label: "Created At" },
    ];

    const filterQuery = parseFilterQuery(filter);
    const filterWhere = buildFilter(filterQuery, filterFields);

    // Handle assigneeLogin filter separately — it's a relation field (assignee.login)
    let assigneeWhere: Record<string, unknown> | undefined;
    if (filterQuery) {
        for (const c of filterQuery.conditions) {
            if (c.field === "assigneeLogin" && c.operator === "contains" && typeof c.value === "string") {
                assigneeWhere = { assignee: { login: { contains: c.value, mode: "insensitive" } } };
            }
        }
    }

    const additionalWheres = [filterWhere, assigneeWhere].filter(Boolean);
    const where: Record<string, unknown> = additionalWheres.length === 0
        ? roleBasedWhere
        : { AND: [roleBasedWhere, ...additionalWheres] };

    const orderBy = buildIssueOrderBy(sortBy, sortOrder);
    const { skip, take } = paginationArgs(page, perPage);

    const [issues, total] = await prisma.$transaction([
        prisma.issue.findMany({ where, orderBy, skip, take, include }),
        prisma.issue.count({ where }),
    ]);

    return {
        issues: issues.map(i => mapIssue(i)),
        total,
        page,
        perPage,
    };
};

export const getIssuesExportService = async (
    request: FastifyRequestTypeBox<typeof getIssuesExportSchema>
): Promise<{ issues: IssueResponse[] }> => {
    const prisma = request.server.prisma;
    const { filter, sortBy, sortOrder = "desc" } = request.query;

    const userId = Number(request.user.sub);
    const userRole = request.user.role;

    const roleBasedWhere: Record<string, unknown> = {};

    if (userRole === Role.ADMIN) {
        // ADMIN sees all issues
    } else {
        const userProjects = await prisma.projectMember.findMany({
            where: { userId },
            select: { projectId: true },
        });

        const projectIds = userProjects.map(up => up.projectId);
        roleBasedWhere.OR = [
            { assigneeId: userId },
            ...(projectIds.length > 0 ? [{ projectId: { in: projectIds } }] : []),
        ];
    }

    const filterFields: FieldDefinition[] = [
        { field: "title", type: "text", label: "Title" },
        { field: "status", type: "enum", enumValues: Object.values(IssueStatus), label: "Status" },
        { field: "priority", type: "enum", enumValues: Object.values(IssuePriority), label: "Priority" },
        { field: "category", type: "enum", enumValues: Object.values(IssueCategory), label: "Category" },
        { field: "createdAt", type: "date", label: "Created At" },
    ];

    const filterQuery = parseFilterQuery(filter);
    const filterWhere = buildFilter(filterQuery, filterFields);

    // Handle assigneeLogin filter separately — it's a relation field (assignee.login)
    let assigneeWhere: Record<string, unknown> | undefined;
    if (filterQuery) {
        for (const c of filterQuery.conditions) {
            if (c.field === "assigneeLogin" && c.operator === "contains" && typeof c.value === "string") {
                assigneeWhere = { assignee: { login: { contains: c.value, mode: "insensitive" } } };
            }
        }
    }

    const additionalWheres = [filterWhere, assigneeWhere].filter(Boolean);
    const where: Record<string, unknown> = additionalWheres.length === 0
        ? roleBasedWhere
        : { AND: [roleBasedWhere, ...additionalWheres] };

    const orderBy = buildIssueOrderBy(sortBy, sortOrder);

    const issues = await prisma.issue.findMany({ where, orderBy, include });

    return { issues: issues.map(i => mapIssue(i)) };
};

export const getProjectIssuesService = async (
    request: FastifyRequestTypeBox<typeof getProjectIssuesSchema>
): Promise<IssueListResponse> => {
    const prisma = request.server.prisma;
    const { id } = request.params;
    const { page = 1, perPage = 20, sortBy, sortOrder = "desc", filter } = request.query;

    await resolveProjectAccess(request, id);
    const localRole = request.projectAccess.localRole ?? undefined;

    const baseWhere: Record<string, unknown> = { projectId: id };

    const filterFields: FieldDefinition[] = [
        { field: "title", type: "text", label: "Title" },
        { field: "status", type: "enum", enumValues: Object.values(IssueStatus), label: "Status" },
        { field: "priority", type: "enum", enumValues: Object.values(IssuePriority), label: "Priority" },
        { field: "category", type: "enum", enumValues: Object.values(IssueCategory), label: "Category" },
        { field: "createdAt", type: "date", label: "Created At" },
    ];

    const filterQuery = parseFilterQuery(filter);
    const filterWhere = buildFilter(filterQuery, filterFields);

    // Handle assigneeLogin filter separately — it's a relation field (assignee.login)
    let assigneeWhere: Record<string, unknown> | undefined;
    if (filterQuery) {
        for (const c of filterQuery.conditions) {
            if (c.field === "assigneeLogin" && c.operator === "contains" && typeof c.value === "string") {
                assigneeWhere = { assignee: { login: { contains: c.value, mode: "insensitive" } } };
            }
        }
    }

    const additionalWheres = [filterWhere, assigneeWhere].filter(Boolean);
    const where: Record<string, unknown> = additionalWheres.length === 0
        ? baseWhere
        : { AND: [baseWhere, ...additionalWheres] };

    const orderBy = buildIssueOrderBy(sortBy, sortOrder);
    const { skip, take } = paginationArgs(page, perPage);

    const [issues, total] = await prisma.$transaction([
        prisma.issue.findMany({ where, orderBy, skip, take, include }),
        prisma.issue.count({ where }),
    ]);

    return {
        issues: issues.map(i => mapIssue(i, localRole)),
        total,
        page,
        perPage,
    };
};

export const getIssueByIdService = async (
    request: FastifyRequestTypeBox<typeof getIssueByIdSchema>
): Promise<IssueResponse> => {
    const prisma = request.server.prisma;
    const { id } = request.params;

    const issue = await getIssueOrThrow(prisma, id);

    await resolveProjectAccess(request, issue.projectId);
    const localRole = request.projectAccess.localRole ?? undefined;

    return mapIssue(issue, localRole);
};

export const createIssueService = async (
    request: FastifyRequestTypeBox<typeof createIssueSchema>
): Promise<IssueResponse> => {
    const prisma = request.server.prisma;
    const { id: projectId } = request.params;
    const body = request.body;

    const userId = Number(request.user.sub);

    await resolveProjectAccess(request, projectId);
    const localRole = request.projectAccess.localRole ?? undefined;

    if (localRole === ProjectMemberRole.VIEWER) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Access denied", "AUTH_FORBIDDEN");
    }

    if (body.assigneeId != null) {
        await assertValidAssignee(prisma, projectId, body.assigneeId);
    }

    const issue = await prisma.issue.create({
        data: {
            title: body.title,
            projectId,
            category: body.category,
            priority: body.priority,
            reproducibility: (body.reproducibility ?? null) as Reproducibility | null,
            productVersionId: body.productVersionId ?? null,
            description: body.description ?? null,
            additionalInfo: body.additionalInfo ?? null,
            status: "NEW",
            assigneeId: body.assigneeId ?? null,
            reporterId: userId,
        },
        include,
    });

    auditLogEmitter.emitAuditLog(prisma, {
        eventType: "ISSUE_CREATED",
        subjectType: "USER",
        objectType: "ISSUE",
        subjectId: userId,
        objectId: issue.id,
        newValue: JSON.stringify({ title: body.title, projectId, category: body.category, priority: body.priority, projectName: issue.project.name }),
        subjectLogin: request.user.login,
        createdAt: new Date().toISOString(),
        projectId,
    });

    return mapIssue(issue as unknown as IssueRow, localRole);
};

export const updateIssueService = async (
    request: FastifyRequestTypeBox<typeof updateIssueSchema>
): Promise<IssueResponse> => {
    const prisma = request.server.prisma;
    const { id } = request.params;
    const body = request.body;

    const userId = Number(request.user.sub);

    const issue = await getIssueOrThrow(prisma, id);
    await resolveProjectAccess(request, issue.projectId);

    const localRole = request.projectAccess.localRole;

    if (localRole === ProjectMemberRole.VIEWER) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Access denied", "AUTH_FORBIDDEN");
    }

    if (localRole === ProjectMemberRole.REPORTER) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Access denied", "AUTH_FORBIDDEN");
    }

    if (
        body.priority !== undefined &&
        body.priority !== issue.priority &&
        localRole === ProjectMemberRole.DEVELOPER
    ) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Insufficient permissions for this priority", "AUTH_FORBIDDEN_PRIORITY");
    }

    if (
        body.status === "NEW" &&
        issue.status !== "NEW" &&
        localRole !== ProjectMemberRole.MANAGER
    ) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Insufficient permissions for new status", "AUTH_FORBIDDEN_STATUS_NEW");
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.reproducibility !== undefined) updateData.reproducibility = body.reproducibility as Reproducibility | null;
    if (body.productVersionId !== undefined) updateData.productVersionId = body.productVersionId;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.additionalInfo !== undefined) updateData.additionalInfo = body.additionalInfo;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId;
    if (body.solution !== undefined) updateData.solution = body.solution;

    if (body.assigneeId !== undefined && body.assigneeId !== null) {
        await assertValidAssignee(prisma, issue.projectId, body.assigneeId);
    }

    if (Object.keys(updateData).length === 0) {
        return mapIssue(issue, localRole);
    }

    const updated = await prisma.issue.update({
        where: { id },
        data: updateData,
        include,
    });

    auditLogEmitter.emitAuditLog(prisma, {
        eventType: "ISSUE_UPDATED",
        subjectType: "USER",
        objectType: "ISSUE",
        subjectId: userId,
        objectId: id,
        oldValue: JSON.stringify({ title: issue.title, status: issue.status, priority: issue.priority, assigneeLogin: issue.assignee?.login ?? null }),
        newValue: JSON.stringify({ title: updated.title, status: updated.status, priority: updated.priority, assigneeLogin: updated.assignee?.login ?? null }),
        subjectLogin: request.user.login,
        createdAt: new Date().toISOString(),
        projectId: issue.projectId,
    });

    return mapIssue(updated as unknown as IssueRow, localRole);
};

export const deleteIssueService = async (
    request: FastifyRequestTypeBox<typeof deleteIssueSchema>
): Promise<null> => {
    const prisma = request.server.prisma;
    const { id } = request.params;

    const userId = Number(request.user.sub);

    const issue = await getIssueOrThrow(prisma, id);
    await resolveProjectAccess(request, issue.projectId, { requiredRoles: [ProjectMemberRole.MANAGER] });

    await prisma.issue.delete({ where: { id } });

    auditLogEmitter.emitAuditLog(prisma, {
        eventType: "ISSUE_DELETED",
        subjectType: "USER",
        objectType: "ISSUE",
        subjectId: userId,
        objectId: id,
        oldValue: JSON.stringify({ title: issue.title, projectName: issue.project.name }),
        subjectLogin: request.user.login,
        createdAt: new Date().toISOString(),
        projectId: issue.projectId,
    });

    return null;
};
