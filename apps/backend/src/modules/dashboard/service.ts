import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";
import { IssueStatus, Role } from "@/generated/prisma/enums.js";


import type { IssueRow } from "@/modules/issues/service.js";
import { mapIssue } from "@/modules/issues/service.js";

import type { ActivityItem, DashboardResponse, ProjectListItem } from "./schema.js";
import { getDashboardSchema } from "./schema.js";

interface IssueAuditData {
    projectName?: string;
    title?: string;
}

interface ProjectAuditData {
    name?: string;
}

const include = {
    project: { select: { name: true } },
    productVersion: { select: { version: true } },
    assignee: { select: { login: true } },
    reporter: { select: { login: true } },
} as const;

const CLOSED_STATUSES: IssueStatus[] = [IssueStatus.RESOLVED, IssueStatus.CLOSED];

const mapAuditEventType = (eventType: string): ActivityItem["type"] | null => {
    switch (eventType) {
        case "ISSUE_CREATED": return "issue_created";
        case "ISSUE_UPDATED": return "issue_updated";
        case "ISSUE_DELETED": return "issue_deleted";
        case "PROJECT_CREATED": return "project_created";
        case "PROJECT_UPDATED": return "project_updated";
        case "PROJECT_DELETED": return "project_deleted";
        default: return null;
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
            select: { id: true, projectId: true, status: true, title: true },
        });

        const issueIdToProjectName = new Map(
            issues.map(i => [i.id, projectIdToName.get(i.projectId) ?? null]),
        );
        const issueIdToTitle = new Map(
            issues.map(i => [i.id, i.title]),
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
                subjectId: userId,
                OR: [
                    { objectType: "ISSUE" },
                    { objectType: "PROJECT" },
                ],
            },
            include: { subject: { select: { login: true } } },
            orderBy: { createdAt: "desc" },
            take: 15,
        });

        const activity: ActivityItem[] = auditLogs.reduce<ActivityItem[]>((acc, log) => {
            const type = mapAuditEventType(log.eventType);
            if (!type) return acc;

            let projectName: string | null = null;
            let issueTitle: string | null = null;

            try {
                const parsed: unknown = type.endsWith("_deleted")
                    ? JSON.parse(log.oldValue ?? "{}")
                    : JSON.parse(log.newValue ?? "{}");

                if (log.objectType === "ISSUE") {
                    const data = parsed as IssueAuditData;
                    projectName = data.projectName ?? null;
                    issueTitle = data.title ?? null;
                } else if (log.objectType === "PROJECT") {
                    const data = parsed as ProjectAuditData;
                    projectName = data.name ?? null;
                }
            } catch {
                // fallback to live data
                if (log.objectType === "ISSUE") {
                    projectName = issueIdToProjectName.get(log.objectId) ?? null;
                    issueTitle = issueIdToTitle.get(log.objectId) ?? null;
                } else if (log.objectType === "PROJECT") {
                    projectName = projectIdToName.get(log.objectId) ?? null;
                }
            }

            acc.push({
                id: log.id,
                type,
                timestamp: log.createdAt.toISOString(),
                projectName,
                projectId: log.objectType === "PROJECT" ? log.objectId : null,
                issueId: log.objectType === "ISSUE" ? log.objectId : null,
                issueTitle,
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
