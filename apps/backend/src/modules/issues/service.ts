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
import { checkProjectMember } from "@/shared/lib/project-access/index.js";
import { assertValidAssignee } from "@/shared/lib/validate-assignee/index.js";
import {
    IssueCategory,
    IssuePriority,
    IssueStatus,
    ProjectMemberRole,
    Reproducibility,
    Role,
} from "@/generated/prisma/enums.js";


import type {
    IssueListResponse,
    IssueResponse,
} from "./schema.js";

import {
    createIssueSchema,
    deleteIssueSchema,
    getIssueByIdSchema,
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

export const mapIssue = (i: IssueRow, myRole?: string): IssueResponse => ({
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
    ...(myRole !== undefined ? { myRole } : {}),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
});

const ISSUE_SORT_FIELDS = new Set(["title", "status", "priority", "category", "createdAt", "updatedAt"]);

const buildIssueOrderBy = (sortBy: string | undefined, sortOrder: string): Record<string, unknown> =>
    buildOrderBy(ISSUE_SORT_FIELDS, sortBy, sortOrder, { createdAt: "desc" });

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
        throw new AppError(HTTP_STATUS.NOT_FOUND, "Задача не найдена", "ISSUE_NOT_FOUND");
    }
    return issue as unknown as IssueRow;
};

export const getIssuesListService = async (
    request: FastifyRequestTypeBox<typeof getIssuesListSchema>
): Promise<IssueListResponse> => {
    const prisma = request.server.prisma;
    const { q, page = 1, perPage = 20, sortBy, sortOrder = "desc", status, priority, category } = request.query;

    const userId = Number(request.user.sub);
    const userRole = request.user.role;

    const where: Record<string, unknown> = {};

    if (userRole === Role.ADMIN) {
        // ADMIN sees all issues
    } else {
        const userProjects = await prisma.projectMember.findMany({
            where: { userId },
            select: { projectId: true },
        });

        const projectIds = userProjects.map(up => up.projectId);
        where.OR = [
            { assigneeId: userId },
            ...(projectIds.length > 0 ? [{ projectId: { in: projectIds } }] : []),
        ];
    }

    if (q) where.title = { contains: q };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

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

export const getProjectIssuesService = async (
    request: FastifyRequestTypeBox<typeof getProjectIssuesSchema>
): Promise<IssueListResponse> => {
    const prisma = request.server.prisma;
    const { id } = request.params;
    const { q, page = 1, perPage = 20, sortBy, sortOrder = "desc", status, priority, category } = request.query;

    const userId = Number(request.user.sub);
    const member = await checkProjectMember(prisma, id, userId);

    const where: Record<string, unknown> = { projectId: id };

    if (q) where.title = { contains: q };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    const orderBy = buildIssueOrderBy(sortBy, sortOrder);
    const { skip, take } = paginationArgs(page, perPage);

    const [issues, total] = await prisma.$transaction([
        prisma.issue.findMany({ where, orderBy, skip, take, include }),
        prisma.issue.count({ where }),
    ]);

    return {
        issues: issues.map(i => mapIssue(i, member?.role)),
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

    const userId = Number(request.user.sub);
    const member = await checkProjectMember(prisma, issue.projectId, userId);

    return mapIssue(issue, member?.role);
};

export const createIssueService = async (
    request: FastifyRequestTypeBox<typeof createIssueSchema>
): Promise<IssueResponse> => {
    const prisma = request.server.prisma;
    const { id: projectId } = request.params;
    const body = request.body;

    const userId = Number(request.user.sub);

    const member = await checkProjectMember(prisma, projectId, userId);

    if (member && member.role === ProjectMemberRole.VIEWER) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Наблюдатель не может создавать задачи", "AUTH_FORBIDDEN");
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

    return mapIssue(issue as unknown as IssueRow, member?.role);
};

const DEVELOPER_ROLES: ProjectMemberRole[] = [
    ProjectMemberRole.DEVELOPER,
    ProjectMemberRole.UPDATER,
    ProjectMemberRole.MANAGER,
];

export const updateIssueService = async (
    request: FastifyRequestTypeBox<typeof updateIssueSchema>
): Promise<IssueResponse> => {
    const prisma = request.server.prisma;
    const { id } = request.params;
    const body = request.body;

    const userId = Number(request.user.sub);

    const issue = await getIssueOrThrow(prisma, id);
    const member = await checkProjectMember(prisma, issue.projectId, userId);

    if (member && member.role === ProjectMemberRole.VIEWER) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Наблюдатель не может редактировать задачи", "AUTH_FORBIDDEN");
    }

    if (member && member.role === ProjectMemberRole.REPORTER) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Репортёр не может редактировать задачи", "AUTH_FORBIDDEN");
    }

    if (
        body.priority !== undefined &&
        body.priority !== issue.priority &&
        member !== undefined &&
        member.role === ProjectMemberRole.DEVELOPER
    ) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Разработчик не может менять приоритет задачи", "AUTH_FORBIDDEN_PRIORITY");
    }

    if (
        body.status === "NEW" &&
        issue.status !== "NEW" &&
        member !== undefined &&
        member.role !== ProjectMemberRole.MANAGER
    ) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Нет прав на изменение статуса на новый", "AUTH_FORBIDDEN_STATUS_NEW");
    }

    if (
        body.status === "RESOLVED" &&
        issue.status !== "RESOLVED" &&
        member !== undefined &&
        !DEVELOPER_ROLES.includes(member.role)
    ) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Нет прав на решение задачи", "AUTH_FORBIDDEN_STATUS_RESOLVED");
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
        return mapIssue(issue, member?.role);
    }

    const updated = await prisma.issue.update({
        where: { id },
        data: updateData,
        include,
    });

    return mapIssue(updated as unknown as IssueRow, member?.role);
};

export const deleteIssueService = async (
    request: FastifyRequestTypeBox<typeof deleteIssueSchema>
): Promise<null> => {
    const prisma = request.server.prisma;
    const { id } = request.params;

    const userId = Number(request.user.sub);

    const issue = await getIssueOrThrow(prisma, id);
    await checkProjectMember(prisma, issue.projectId, userId, ["MANAGER"], true);

    await prisma.issue.delete({ where: { id } });

    return null;
};
