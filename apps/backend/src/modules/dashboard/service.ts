import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";
import { IssueStatus, Role } from "@/generated/prisma/enums.js";

import type { IssueRow } from "@/modules/issues/service.js";
import { mapIssue } from "@/modules/issues/service.js";

import type { ActivityItem, DashboardResponse, ProjectListItem } from "./schema.js";
import { getDashboardSchema } from "./schema.js";

const include = {
    project: { select: { name: true } },
    productVersion: { select: { version: true } },
    assignee: { select: { login: true } },
    reporter: { select: { login: true } },
} as const;

const CLOSED_STATUSES: IssueStatus[] = [IssueStatus.RESOLVED, IssueStatus.CLOSED];

const mapAuditEventType = (eventType: string): ActivityItem["type"] | null => {
    const lower = eventType.toLowerCase();
    if (lower.includes("creat")) return "issue_created";
    if (lower.includes("status")) return "status_changed";
    if (lower.includes("assign")) return "assigned";
    return null;
};

const buildActivityMessage = (
    login: string,
    type: ActivityItem["type"],
    issueId: number,
    newValue?: string | null,
): string => {
    switch (type) {
        case "issue_created":
            return `${login} создал задачу Issue #${issueId}`;
        case "status_changed":
            return `${login} изменил статус Issue #${issueId} на ${newValue ?? "UNKNOWN"}`;
        case "assigned":
            return `${login} назначил задачу Issue #${issueId}`;
    }
};

export const getDashboardService = async (
    request: FastifyRequestTypeBox<typeof getDashboardSchema>,
): Promise<DashboardResponse> => {
    const prisma = request.server.prisma;
    const userId = Number(request.user.sub);
    const userRole = request.user.role;

    const projectsWhere: Record<string, unknown> = userRole === Role.ADMIN
        ? {}
        : { memberships: { some: { userId } } };

    const projects = await prisma.project.findMany({
        where: projectsWhere,
        select: { id: true, name: true, status: true, description: true, updatedAt: true },
    });

    const projectIds = projects.map(p => p.id);
    const projectIdToName = new Map(projects.map(p => [p.id, p.name]));

    const issues = await prisma.issue.findMany({
        where: { projectId: { in: projectIds } },
        select: { id: true, projectId: true, status: true },
    });

    const issueIdToProjectName = new Map(
        issues.map(i => [i.id, projectIdToName.get(i.projectId) ?? null]),
    );

    const projectsList: ProjectListItem[] = projects.map(project => {
        const projectIssues = issues.filter(i => i.projectId === project.id);

        return {
            id: project.id,
            name: project.name,
            status: project.status,
            description: project.description,
            updatedAt: project.updatedAt.toISOString(),
            totalIssues: projectIssues.length,
            openIssues: projectIssues.filter(i => !CLOSED_STATUSES.includes(i.status)).length,
        };
    });

    const auditLogs = await prisma.auditLog.findMany({
        where: {
            objectType: "Issue",
            objectId: { in: issueIdToProjectName.size > 0 ? [...issueIdToProjectName.keys()] : [] },
        },
        include: { subject: { select: { login: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    const activity: ActivityItem[] = auditLogs.reduce<ActivityItem[]>((acc, log) => {
        const type = mapAuditEventType(log.eventType);
        if (!type) return acc;
        acc.push({
            id: log.id,
            type,
            message: buildActivityMessage(log.subject.login, type, log.objectId, log.newValue),
            timestamp: log.createdAt.toISOString(),
            projectName: issueIdToProjectName.get(log.objectId) ?? null,
            issueId: log.objectType === "Issue" ? log.objectId : null,
        });
        return acc;
    }, []);

    const myIssues = await prisma.issue.findMany({
        where: userRole === Role.ADMIN
            ? { assigneeId: userId }
            : { assigneeId: userId, projectId: { in: projectIds } },
        include,
        orderBy: { updatedAt: "desc" },
        take: 10,
    });

    const totalAssigned = await prisma.issue.count({
        where: userRole === Role.ADMIN
            ? { assigneeId: userId }
            : { assigneeId: userId, projectId: { in: projectIds } },
    });

    const totalClosed = await prisma.issue.count({
        where: userRole === Role.ADMIN
            ? { assigneeId: userId, status: { in: [IssueStatus.RESOLVED, IssueStatus.CLOSED] } }
            : { assigneeId: userId, projectId: { in: projectIds }, status: { in: [IssueStatus.RESOLVED, IssueStatus.CLOSED] } },
    });

    const totalUsers = userRole === Role.ADMIN
        ? await prisma.user.count()
        : undefined;

    return {
        summary: {
            totalProjects: projects.length,
            totalAssigned,
            totalClosed,
            ...(totalUsers !== undefined && { totalUsers }),
        },
        projects: projectsList,
        activity,
        myIssues: myIssues.map(i => mapIssue(i as unknown as IssueRow)),
    };
};
