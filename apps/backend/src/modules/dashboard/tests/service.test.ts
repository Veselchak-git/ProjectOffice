/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Role, IssueStatus, ProjectStatus } from "@/generated/prisma/enums.js";

import { defaultBuildTestApp } from "@/shared/lib/testing/defaultBuildTestApp.test-helper.js";

import { auditLogEmitter } from "@/modules/audit-log/emitter.js";

import { getDashboardService } from "../service.js";

vi.mock("@/modules/audit-log/emitter.js", () => ({
    auditLogEmitter: {
        emitAuditLog: vi.fn().mockResolvedValue(undefined),
    },
}));

const mockProjects = [
    { id: 1, name: "Project Alpha", status: ProjectStatus.ACTIVE, description: "First project", updatedAt: new Date("2025-06-01T00:00:00.000Z") },
    { id: 2, name: "Project Beta", status: ProjectStatus.ACTIVE, description: null, updatedAt: new Date("2025-06-02T00:00:00.000Z") },
];

const mockIssues = [
    { id: 10, projectId: 1, status: IssueStatus.NEW, title: "Bug in login" },
    { id: 11, projectId: 1, status: IssueStatus.RESOLVED, title: "Fixed layout" },
    { id: 12, projectId: 2, status: IssueStatus.ACKNOWLEDGED, title: "Feature request" },
];

const mockMyIssues = [
    {
        id: 10,
        title: "Bug in login",
        projectId: 1,
        category: "BUG",
        priority: "CRITICAL",
        reproducibility: "ALWAYS",
        productVersionId: null,
        description: "Login fails sometimes",
        additionalInfo: null,
        status: IssueStatus.NEW,
        assigneeId: 1,
        reporterId: 1,
        solution: null,
        createdAt: new Date("2025-06-01T00:00:00.000Z"),
        updatedAt: new Date("2025-06-05T00:00:00.000Z"),
        project: { name: "Project Alpha" },
        productVersion: null,
        assignee: { login: "admin@example.com" },
        reporter: { login: "admin@example.com" },
    },
];

const mockAuditLogs = [
    {
        id: 100,
        eventType: "ISSUE_CREATED",
        objectType: "ISSUE",
        objectId: 10,
        subjectId: 1,
        newValue: JSON.stringify({ projectName: "Project Alpha", title: "Bug in login" }),
        oldValue: null,
        createdAt: new Date("2025-06-01T00:00:00.000Z"),
        subject: { login: "admin@example.com" },
    },
    {
        id: 101,
        eventType: "PROJECT_CREATED",
        objectType: "PROJECT",
        objectId: 1,
        subjectId: 1,
        newValue: JSON.stringify({ name: "Project Alpha" }),
        oldValue: null,
        createdAt: new Date("2025-06-02T00:00:00.000Z"),
        subject: { login: "admin@example.com" },
    },
];

const buildTestApp = async () => {
    const fastify = defaultBuildTestApp();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    const mockPrisma: any = {
        project: {
            findMany: async () => [...mockProjects],
        },
        issue: {
            findMany: async (args?: { where?: Record<string, unknown>; include?: unknown; orderBy?: unknown; take?: number }) => {
                if (args?.take === 10) {
                    return [...mockMyIssues];
                }
                return [...mockIssues];
            },
            count: async (args?: { where?: Record<string, unknown> }) => {
                const where = args?.where ?? {};
                if ("status" in where && where.status) {
                    return 1;
                }
                return 3;
            },
        },
        auditLog: {
            findMany: async () => [...mockAuditLogs],
        },
        user: {
            count: async () => 2,
        },
    };

    fastify.decorate("prisma", mockPrisma);

    return fastify;
};

const buildRequest = (
    app: Awaited<ReturnType<typeof buildTestApp>>,
    overrides: Record<string, unknown> = {},
) =>
    ({
        server: app,
        user: { sub: "1", login: "admin@example.com", role: Role.ADMIN },
        ...overrides,
    }) as any;

describe("dashboard service", () => {
    let app: Awaited<ReturnType<typeof buildTestApp>>;

    beforeEach(async () => {
        app = await buildTestApp();
        vi.clearAllMocks();
    });

    afterEach(async () => {
        await app?.close();
    });

    describe("getDashboardService", () => {
        it("returns dashboard data for ADMIN with all projects", async () => {
            const request = buildRequest(app);

            const result = await getDashboardService(request);

            expect(result.summary.totalProjects).toBe(2);
            expect(result.summary.totalAssigned).toBe(3);
            expect(result.summary.totalClosed).toBe(1);
            expect(result.summary.totalUsers).toBe(2);
            expect(result.projects).toHaveLength(2);
            expect(result.projects[0]!.name).toBe("Project Alpha");
            expect(result.projects[1]!.name).toBe("Project Beta");
        });

        it("returns correct project issue counts", async () => {
            const request = buildRequest(app);

            const result = await getDashboardService(request);

            const alpha = result.projects.find(p => p.name === "Project Alpha");
            expect(alpha).toBeDefined();
            expect(alpha!.totalIssues).toBe(2);
            expect(alpha!.openIssues).toBe(1);
        });

        it("returns activity items from audit logs", async () => {
            const request = buildRequest(app);

            const result = await getDashboardService(request);

            expect(result.activity).toHaveLength(2);

            const issueActivity = result.activity.find(a => a.type === "issue_created");
            expect(issueActivity).toBeDefined();
            expect(issueActivity!.projectName).toBe("Project Alpha");
            expect(issueActivity!.issueTitle).toBe("Bug in login");

            const projectActivity = result.activity.find(a => a.type === "project_created");
            expect(projectActivity).toBeDefined();
            expect(projectActivity!.projectName).toBe("Project Alpha");
        });

        it("returns myIssues list", async () => {
            const request = buildRequest(app);

            const result = await getDashboardService(request);

            expect(result.myIssues).toHaveLength(1);
            expect(result.myIssues[0]!.title).toBe("Bug in login");
            expect(result.myIssues[0]!.projectName).toBe("Project Alpha");
        });

        it("filters projects by membership for non-ADMIN user", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.project.findMany as any) = async () => [
                { id: 1, name: "Project Alpha", status: ProjectStatus.ACTIVE, description: "First project", updatedAt: new Date("2025-06-01T00:00:00.000Z") },
            ];

            const request = buildRequest(app, {
                user: { sub: "2", login: "user@example.com", role: Role.USER },
            });

            const result = await getDashboardService(request);

            expect(result.projects).toHaveLength(1);
            expect(result.projects[0]!.name).toBe("Project Alpha");
            expect(result.summary.totalUsers).toBeUndefined();
        });

        it("returns undefined totalUsers for non-ADMIN user", async () => {
            const request = buildRequest(app, {
                user: { sub: "2", login: "user@example.com", role: Role.USER },
            });

            const result = await getDashboardService(request);

            expect(result.summary.totalUsers).toBeUndefined();
        });

        it("handles audit logs with invalid JSON gracefully", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.auditLog.findMany as any) = async () => [
                {
                    id: 200,
                    eventType: "ISSUE_UPDATED",
                    objectType: "ISSUE",
                    objectId: 10,
                    subjectId: 1,
                    newValue: "invalid-json",
                    oldValue: null,
                    createdAt: new Date("2025-06-03T00:00:00.000Z"),
                    subject: { login: "admin@example.com" },
                },
            ];

            const request = buildRequest(app);

            const result = await getDashboardService(request);

            expect(result.activity).toHaveLength(1);
            expect(result.activity[0]!.type).toBe("issue_updated");
            expect(result.activity[0]!.projectName).toBe("Project Alpha");
        });

        it("filters out unknown audit event types", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.auditLog.findMany as any) = async () => [
                {
                    id: 300,
                    eventType: "USER_CREATED",
                    objectType: "USER",
                    objectId: 1,
                    subjectId: 1,
                    newValue: JSON.stringify({}),
                    oldValue: null,
                    createdAt: new Date("2025-06-04T00:00:00.000Z"),
                    subject: { login: "admin@example.com" },
                },
            ];

            const request = buildRequest(app);

            const result = await getDashboardService(request);

            expect(result.activity).toHaveLength(0);
        });

        it("includes deleted audit log data from oldValue", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.auditLog.findMany as any) = async () => [
                {
                    id: 400,
                    eventType: "ISSUE_DELETED",
                    objectType: "ISSUE",
                    objectId: 10,
                    subjectId: 1,
                    newValue: null,
                    oldValue: JSON.stringify({ projectName: "Project Alpha", title: "Deleted issue" }),
                    createdAt: new Date("2025-06-05T00:00:00.000Z"),
                    subject: { login: "admin@example.com" },
                },
            ];

            const request = buildRequest(app);

            const result = await getDashboardService(request);

            expect(result.activity).toHaveLength(1);
            expect(result.activity[0]!.type).toBe("issue_deleted");
            expect(result.activity[0]!.issueTitle).toBe("Deleted issue");
        });

        it("returns empty results when no data exists", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.project.findMany as any) = async () => [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.issue.findMany as any) = async () => [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.issue.count as any) = async () => 0;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.auditLog.findMany as any) = async () => [];

            const request = buildRequest(app);

            const result = await getDashboardService(request);

            expect(result.summary.totalProjects).toBe(0);
            expect(result.summary.totalAssigned).toBe(0);
            expect(result.summary.totalClosed).toBe(0);
            expect(result.projects).toHaveLength(0);
            expect(result.activity).toHaveLength(0);
            expect(result.myIssues).toHaveLength(0);
        });
    });
});
