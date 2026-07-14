import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";
import { ProjectMemberRole, Role } from "@/generated/prisma/enums.js";
import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";

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

type IssueRow = {
    id: number;
    title: string;
    projectId: number;
    category: string;
    priority: string;
    reproducibility: string | null;
    productVersionId: number | null;
    description: string | null;
    additionalInfo: string | null;
    status: string;
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

const mapIssue = (i: IssueRow, myRole?: string): IssueResponse => ({
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

const buildIssueOrderBy = (sortBy: string | undefined, sortOrder: string): Record<string, unknown> => {
    if (!sortBy || !ISSUE_SORT_FIELDS.has(sortBy)) {
        return { createdAt: "desc" };
    }
    return { [sortBy]: sortOrder };
};

const include = {
    project: { select: { name: true } },
    productVersion: { select: { version: true } },
    assignee: { select: { login: true } },
    reporter: { select: { login: true } },
} as const;

const checkProjectMember = async (
    prisma: any,
    projectId: number,
    userId: number,
    requiredRoles?: string[],
    allowAdmin = true,
) => {
    if (allowAdmin) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        if (user?.role === Role.ADMIN) return;
    }

    const member = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId } },
    });

    if (!member) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Доступ запрещён", "AUTH_FORBIDDEN");
    }

    if (requiredRoles && !requiredRoles.includes(member.role)) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Доступ запрещён", "AUTH_FORBIDDEN");
    }

    return member;
};

const getIssueOrThrow = async (prisma: any, id: number): Promise<IssueRow> => {
    const issue = await prisma.issue.findUnique({
        where: { id },
        include,
    });
    if (!issue) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, "Задача не найдена", "ISSUE_NOT_FOUND");
    }
    return issue;
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
        const managerProjects = await prisma.projectMember.findMany({
            where: { userId, role: ProjectMemberRole.MANAGER },
            select: { projectId: true },
        });

        if (managerProjects.length > 0) {
            const managerProjectIds = managerProjects.map(mp => mp.projectId);
            where.OR = [
                { assigneeId: userId },
                { projectId: { in: managerProjectIds } },
            ];
        } else {
            where.assigneeId = userId;
        }
    }

    if (q) where.title = { contains: q };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    const orderBy = buildIssueOrderBy(sortBy, sortOrder);
    const skip = (page - 1) * perPage;

    const [issues, total] = await prisma.$transaction([
        prisma.issue.findMany({ where, orderBy, skip, take: perPage, include }),
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
    const skip = (page - 1) * perPage;

    const [issues, total] = await prisma.$transaction([
        prisma.issue.findMany({ where, orderBy, skip, take: perPage, include }),
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
        const assigneeMember = await prisma.projectMember.findUnique({
            where: { userId_projectId: { userId: body.assigneeId, projectId } },
        });
        if (!assigneeMember) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, "Пользователь не является участником проекта", "INVALID_ASSIGNEE");
        }
    }

    const issue = await prisma.issue.create({
        data: {
            title: body.title,
            projectId,
            category: body.category as any,
            priority: body.priority as any,
            reproducibility: (body.reproducibility ?? null) as any,
            productVersionId: body.productVersionId ?? null,
            description: body.description ?? null,
            additionalInfo: body.additionalInfo ?? null,
            status: "NEW",
            assigneeId: body.assigneeId ?? null,
            reporterId: userId,
        },
        include,
    });

    return mapIssue(issue, member?.role);
};

const DEVELOPER_ROLES = [ProjectMemberRole.DEVELOPER, ProjectMemberRole.MANAGER];

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
        body.assigneeId !== undefined &&
        body.assigneeId !== issue.assigneeId &&
        member !== undefined &&
        !DEVELOPER_ROLES.includes(member.role)
    ) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Нет прав на назначение исполнителя", "AUTH_FORBIDDEN");
    }

    if (
        body.status === "RESOLVED" &&
        issue.status !== "RESOLVED" &&
        member !== undefined &&
        !DEVELOPER_ROLES.includes(member.role)
    ) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Нет прав на решение задачи", "AUTH_FORBIDDEN");
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.category !== undefined) updateData.category = body.category as any;
    if (body.priority !== undefined) updateData.priority = body.priority as any;
    if (body.reproducibility !== undefined) updateData.reproducibility = body.reproducibility as any;
    if (body.productVersionId !== undefined) updateData.productVersionId = body.productVersionId;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.additionalInfo !== undefined) updateData.additionalInfo = body.additionalInfo;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId;
    if (body.solution !== undefined) updateData.solution = body.solution;

    if (body.assigneeId !== undefined && body.assigneeId !== null) {
        const assigneeMember = await prisma.projectMember.findUnique({
            where: { userId_projectId: { userId: body.assigneeId, projectId: issue.projectId } },
        });
        if (!assigneeMember) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, "Пользователь не является участником проекта", "INVALID_ASSIGNEE");
        }
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
