/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Role, IssueStatus, ProjectStatus } from "@/generated/prisma/enums.js";

import type { JwtPayload } from "@/plugins/jwt-plugin/model.js";

import { cookiePlugin } from "@/plugins/cookie-plugin/index.js";
import { jwtPlugin } from "@/plugins/jwt-plugin/index.js";

import { defaultBuildTestApp } from "@/shared/lib/testing/defaultBuildTestApp.test-helper.js";

import { auditLogEmitter } from "@/modules/audit-log/emitter.js";

import { dashboardControllerPlugin } from "../controller.js";

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
];

const buildTestApp = async () => {
    const fastify = defaultBuildTestApp();

    await fastify.register(cookiePlugin);
    await fastify.register(jwtPlugin);

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

    await fastify.register(
        async scoped => {
            await scoped.register(dashboardControllerPlugin);
        },
        { prefix: "/api" },
    );

    return fastify;
};

const getResponseJson = <T>(payload: string): T => JSON.parse(payload) as T;

describe("dashboardController", () => {
    let app: Awaited<ReturnType<typeof buildTestApp>>;

    beforeEach(async () => {
        app = await buildTestApp();
    });

    afterEach(async () => {
        await app?.close();
    });

    const signAdminToken = () =>
        app.jwt.sign({
            sub: "1",
            login: "admin@example.com",
            role: Role.ADMIN,
        } satisfies JwtPayload);

    const signUserToken = () =>
        app.jwt.sign({
            sub: "2",
            login: "user@example.com",
            role: Role.USER,
        } satisfies JwtPayload);

    describe("GET /dashboard", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/dashboard",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 with dashboard data for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/dashboard",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{
                summary: { totalProjects: number; totalAssigned: number; totalClosed: number; totalUsers?: number };
                projects: Array<{ id: number; name: string }>;
                activity: Array<{ id: number; type: string; timestamp: string }>;
                myIssues: Array<{ id: number; title: string }>;
            }>(response.payload);

            expect(body.summary.totalProjects).toBe(2);
            expect(body.summary.totalAssigned).toBe(3);
            expect(body.summary.totalClosed).toBe(1);
            expect(body.summary.totalUsers).toBe(2);
            expect(body.projects).toHaveLength(2);
            expect(body.activity).toHaveLength(1);
            expect(body.myIssues).toHaveLength(1);
        });

        it("returns 200 with dashboard data for USER", async () => {
            const token = await signUserToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/dashboard",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{
                summary: { totalProjects: number; totalUsers?: number };
            }>(response.payload);

            expect(body.summary.totalProjects).toBe(2);
            expect(body.summary.totalUsers).toBeUndefined();
        });

        it("returns correct project structure", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/dashboard",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{
                projects: Array<{
                    id: number;
                    name: string;
                    status: string;
                    description: string | null;
                    updatedAt: string;
                    totalIssues: number;
                    openIssues: number;
                }>;
            }>(response.payload);

            const alpha = body.projects.find(p => p.name === "Project Alpha");
            expect(alpha).toBeDefined();
            expect(alpha!.status).toBe("ACTIVE");
            expect(alpha!.totalIssues).toBe(2);
            expect(alpha!.openIssues).toBe(1);
            expect(alpha!.updatedAt).toBe("2025-06-01T00:00:00.000Z");
        });

        it("returns activity items with correct structure", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/dashboard",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{
                activity: Array<{
                    id: number;
                    type: string;
                    timestamp: string;
                    projectName: string | null;
                    issueId: number | null;
                    issueTitle: string | null;
                }>;
            }>(response.payload);

            expect(body.activity[0]!.type).toBe("issue_created");
            expect(body.activity[0]!.projectName).toBe("Project Alpha");
            expect(body.activity[0]!.issueTitle).toBe("Bug in login");
            expect(body.activity[0]!.issueId).toBe(10);
        });
    });
});
