/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Role } from "@/generated/prisma/client.js";

import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";
import { defaultBuildTestApp } from "@/shared/lib/testing/defaultBuildTestApp.test-helper.js";

import { auditLogEmitter } from "@/modules/audit-log/emitter.js";

import {
    getIssuesListService,
    getIssuesExportService,
    getProjectIssuesService,
    getIssueByIdService,
    createIssueService,
    updateIssueService,
    deleteIssueService,
} from "../service.js";

vi.mock("@/shared/lib/project-access/index.js", () => ({
    resolveProjectAccess: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/modules/audit-log/emitter.js", () => ({
    auditLogEmitter: {
        emitAuditLog: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock("@/shared/lib/validate-assignee/index.js", () => ({
    assertValidAssignee: vi.fn().mockResolvedValue(undefined),
}));

const mockIssues = [
    {
        id: 1,
        title: "Bug 1",
        projectId: 1,
        category: "BUG",
        priority: "CRITICAL",
        status: "NEW",
        assigneeId: 1,
        reporterId: 1,
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: new Date("2025-01-01T00:00:00.000Z"),
        productVersionId: null,
        reproducibility: null,
        additionalInfo: null,
        description: null,
        solution: null,
        project: { name: "Project A" },
        productVersion: null,
        assignee: { login: "admin@example.com" },
        reporter: { login: "admin@example.com" },
    },
    {
        id: 2,
        title: "Bug 2",
        projectId: 2,
        category: "FEATURE",
        priority: "MINOR",
        status: "RESOLVED",
        assigneeId: null,
        reporterId: 2,
        createdAt: new Date("2025-01-02T00:00:00.000Z"),
        updatedAt: new Date("2025-01-02T00:00:00.000Z"),
        productVersionId: null,
        productVersion: null,
        reproducibility: null,
        additionalInfo: null,
        description: null,
        solution: null,
        project: { name: "Project B" },
        assignee: null,
        reporter: { login: "user@example.com" },
    },
];

const buildTestApp = async () => {
    const fastify = defaultBuildTestApp();

    let nextId = 3;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    const mockPrisma: any = {
        $transaction: async (queries: Promise<unknown>[]) => {
            const results = await Promise.all(queries);
            return results;
        },
        issue: {
            findMany: async (_args?: Record<string, unknown>) => [...mockIssues],
            findUnique: async (args: { where: Record<string, unknown> }) =>
                mockIssues.find(i => i.id === (args.where as { id: number }).id) ?? null,
            count: async () => mockIssues.length,
            create: async (args: { data: Record<string, unknown> }) => ({
                id: nextId++,
                ...args.data,
                createdAt: new Date(),
                updatedAt: new Date(),
                project: { name: "Project A" },
                productVersion: null,
                assignee: args.data.assigneeId ? { login: "admin@example.com" } : null,
                reporter: { login: "admin@example.com" },
            }),
            update: async (args: { where: { id: number }; data: Record<string, unknown> }) => {
                const existing = mockIssues.find(i => i.id === args.where.id);
                return {
                    ...existing,
                    ...args.data,
                    updatedAt: new Date(),
                    project: existing?.project ?? { name: "Project A" },
                    productVersion: existing?.productVersion ?? null,
                    assignee: args.data.assigneeId != null
                        ? { login: "admin@example.com" }
                        : existing?.assignee ?? null,
                    reporter: existing?.reporter ?? { login: "admin@example.com" },
                };
            },
            delete: async () => ({}),
        },
        projectMember: {
            findMany: async () => [{ projectId: 1 }],
            findUnique: async () => ({ userId: 1, projectId: 1, role: "MANAGER" }),
        },
        user: {
            findUnique: async () => ({ role: Role.ADMIN }),
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
        query: { page: 1, perPage: 20, sortBy: undefined, sortOrder: "desc", filter: undefined },
        body: {},
        params: {},
        projectAccess: { globalRole: Role.ADMIN, localRole: null },
        ...overrides,
    }) as any;

describe("issues service", () => {
    let app: Awaited<ReturnType<typeof buildTestApp>>;

    beforeEach(async () => {
        app = await buildTestApp();
        vi.mocked(auditLogEmitter.emitAuditLog).mockClear();
    });

    afterEach(async () => {
        await app?.close();
    });

    describe("getIssuesListService", () => {
        it("returns issues with pagination info for ADMIN", async () => {
            const request = buildRequest(app);

            const result = await getIssuesListService(request);

            expect(result.issues).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.perPage).toBe(20);
            expect(result.issues[0]!.title).toBe("Bug 1");
            expect(result.issues[0]!.projectName).toBe("Project A");
        });

        it("returns filtered issues for non-ADMIN user based on project membership", async () => {
            const request = buildRequest(app, {
                user: { sub: "2", login: "user@example.com", role: Role.USER },
            });

            const result = await getIssuesListService(request);

            expect(result.issues).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it("passes correct pagination params to prisma", async () => {
            let capturedSkip = 0;
            let capturedTake = 0;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.issue.findMany as any) = async (args: { skip?: number; take?: number }) => {
                capturedSkip = args.skip ?? 0;
                capturedTake = args.take ?? 20;
                return [mockIssues[0]];
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.issue.count as any) = async () => 50;

            const request = buildRequest(app, {
                query: { page: 2, perPage: 5, sortBy: undefined, sortOrder: "desc", filter: undefined },
            });

            const result = await getIssuesListService(request);

            expect(capturedSkip).toBe(5);
            expect(capturedTake).toBe(5);
            expect(result.total).toBe(50);
            expect(result.page).toBe(2);
            expect(result.perPage).toBe(5);
        });
    });

    describe("getIssuesExportService", () => {
        it("returns issues without pagination for ADMIN", async () => {
            const request = buildRequest(app, {
                query: { filter: undefined, sortBy: undefined, sortOrder: "desc" },
            });

            const result = await getIssuesExportService(request);

            expect(result.issues).toHaveLength(2);
            expect(result.issues[0]!.title).toBe("Bug 1");
            expect(result.issues[1]!.title).toBe("Bug 2");
        });

        it("returns filtered issues for non-ADMIN user", async () => {
            const request = buildRequest(app, {
                user: { sub: "2", login: "user@example.com", role: Role.USER },
                query: { filter: undefined, sortBy: undefined, sortOrder: "desc" },
            });

            const result = await getIssuesExportService(request);

            expect(result.issues).toHaveLength(2);
        });
    });

    describe("getProjectIssuesService", () => {
        it("returns issues for a specific project", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                query: { page: 1, perPage: 20, sortBy: undefined, sortOrder: "desc", filter: undefined },
            });

            const result = await getProjectIssuesService(request);

            expect(result.issues).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.perPage).toBe(20);
        });

        it("sets localRole on request.projectAccess from project access resolution", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                query: { page: 1, perPage: 20, sortBy: undefined, sortOrder: "desc", filter: undefined },
                projectAccess: { globalRole: Role.USER, localRole: "DEVELOPER" },
            });

            const result = await getProjectIssuesService(request);

            expect(result.issues).toHaveLength(2);
        });
    });

    describe("getIssueByIdService", () => {
        it("returns a single issue by ID", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
            });

            const result = await getIssueByIdService(request);

            expect(result.id).toBe(1);
            expect(result.title).toBe("Bug 1");
            expect(result.projectName).toBe("Project A");
        });

        it("throws 404 for non-existent issue", async () => {
            const request = buildRequest(app, {
                params: { id: 999 },
            });

            await expect(getIssueByIdService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.NOT_FOUND, "Issue not found", "ISSUE_NOT_FOUND"),
            );
        });

        it("includes localRole in response when projectAccess has localRole", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                projectAccess: { globalRole: Role.USER, localRole: "MANAGER" },
            });

            const result = await getIssueByIdService(request);

            expect(result.id).toBe(1);
            expect(result.myRole).toBe("MANAGER");
        });
    });

    describe("createIssueService", () => {
        it("creates an issue and emits audit log", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                body: {
                    title: "New Bug",
                    category: "BUG",
                    priority: "GENERAL",
                },
            });

            const result = await createIssueService(request);

            expect(result.title).toBe("New Bug");
            expect(result.id).toBeDefined();
            expect(auditLogEmitter.emitAuditLog).toHaveBeenCalledWith(
                app.prisma,
                expect.objectContaining({
                    eventType: "ISSUE_CREATED",
                    subjectType: "USER",
                    objectType: "ISSUE",
                }),
            );
        });

        it("throws 403 for VIEWER role", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                body: {
                    title: "New Bug",
                    category: "BUG",
                    priority: "GENERAL",
                },
                projectAccess: { globalRole: Role.USER, localRole: "VIEWER" },
            });

            await expect(createIssueService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.FORBIDDEN, "Access denied", "AUTH_FORBIDDEN"),
            );
        });
    });

    describe("updateIssueService", () => {
        it("updates an issue and emits audit log", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                body: { title: "Updated Bug" },
            });

            const result = await updateIssueService(request);

            expect(result.title).toBe("Updated Bug");
            expect(auditLogEmitter.emitAuditLog).toHaveBeenCalledWith(
                app.prisma,
                expect.objectContaining({
                    eventType: "ISSUE_UPDATED",
                    subjectType: "USER",
                    objectType: "ISSUE",
                }),
            );
        });

        it("throws 404 for non-existent issue", async () => {
            const request = buildRequest(app, {
                params: { id: 999 },
                body: { title: "Updated" },
            });

            await expect(updateIssueService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.NOT_FOUND, "Issue not found", "ISSUE_NOT_FOUND"),
            );
        });

        it("throws 403 for VIEWER role", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                body: { title: "Updated" },
                projectAccess: { globalRole: Role.USER, localRole: "VIEWER" },
            });

            await expect(updateIssueService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.FORBIDDEN, "Access denied", "AUTH_FORBIDDEN"),
            );
        });

        it("throws 403 for REPORTER role", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                body: { title: "Updated" },
                projectAccess: { globalRole: Role.USER, localRole: "REPORTER" },
            });

            await expect(updateIssueService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.FORBIDDEN, "Access denied", "AUTH_FORBIDDEN"),
            );
        });

        it("throws 403 when DEVELOPER tries to change priority", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                body: { priority: "MINOR" },
                projectAccess: { globalRole: Role.USER, localRole: "DEVELOPER" },
            });

            await expect(updateIssueService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.FORBIDDEN, "Insufficient permissions for this priority", "AUTH_FORBIDDEN_PRIORITY"),
            );
        });

        it("returns existing issue when no fields to update", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                body: {},
            });

            const result = await updateIssueService(request);

            expect(result.id).toBe(1);
            expect(result.title).toBe("Bug 1");
        });
    });

    describe("deleteIssueService", () => {
        it("deletes an issue and emits audit log", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                user: { sub: "1", login: "admin@example.com", role: Role.ADMIN },
            });

            const result = await deleteIssueService(request);

            expect(result).toBeNull();
            expect(auditLogEmitter.emitAuditLog).toHaveBeenCalledWith(
                app.prisma,
                expect.objectContaining({
                    eventType: "ISSUE_DELETED",
                    subjectType: "USER",
                    objectType: "ISSUE",
                }),
            );
        });

        it("throws 404 for non-existent issue", async () => {
            const request = buildRequest(app, {
                params: { id: 999 },
                user: { sub: "1", login: "admin@example.com", role: Role.ADMIN },
            });

            await expect(deleteIssueService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.NOT_FOUND, "Issue not found", "ISSUE_NOT_FOUND"),
            );
        });
    });
});