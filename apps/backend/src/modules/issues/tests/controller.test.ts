/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Role } from "@/generated/prisma/client.js";

import type { JwtPayload } from "@/plugins/jwt-plugin/model.js";

import { cookiePlugin } from "@/plugins/cookie-plugin/index.js";
import { jwtPlugin } from "@/plugins/jwt-plugin/index.js";
import { projectAccessPlugin } from "@/plugins/project-access-plugin/index.js";

import { defaultBuildTestApp } from "@/shared/lib/testing/defaultBuildTestApp.test-helper.js";

import { issuesControllerPlugin } from "../controller.js";

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

    await fastify.register(cookiePlugin);
    await fastify.register(jwtPlugin);
    await fastify.register(projectAccessPlugin);

    let nextId = 3;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    const mockPrisma: any = {
        $transaction: async (queries: Promise<unknown>[]) => {
            const results = await Promise.all(queries);
            return results;
        },
        project: {
            findUnique: async (args: { where: { id: number } }) => {
                if (args.where.id === 1) return { id: 1 };
                return null;
            },
        },
        issue: {
            findMany: async (args?: { where?: Record<string, unknown>; skip?: number; take?: number }) => {
                let filtered = [...mockIssues];
                if (args?.skip !== undefined && args?.take !== undefined) {
                    filtered = filtered.slice(args.skip, args.skip + args.take);
                }
                return filtered;
            },
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
            findUnique: async (args: { where: Record<string, unknown> }) => {
                const where = args.where as Record<string, unknown>;
                if (where?.userId_projectId) {
                    return { userId: 1, projectId: 1, role: "MANAGER" };
                }
                return null;
            },
        },
        user: {
            findUnique: async () => ({ role: Role.ADMIN }),
        },
        auditLog: {
            create: async () => ({ id: 1 }),
        },
    };

    fastify.decorate("prisma", mockPrisma);

    await fastify.register(
        async scopedFastify => {
            await scopedFastify.register(issuesControllerPlugin);
        },
        { prefix: "/api" },
    );

    return fastify;
};

const getResponseJson = <T>(payload: string): T => JSON.parse(payload) as T;

describe("issuesController", () => {
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

    describe("GET /api/issues", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/issues",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 with issues list for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/issues",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{
                issues: Array<{ id: number; title: string }>;
                total: number;
                page: number;
                perPage: number;
            }>(response.payload);

            expect(body.issues).toHaveLength(2);
            expect(body.total).toBe(2);
            expect(body.page).toBe(1);
            expect(body.perPage).toBe(20);
            expect(body.issues[0]!.title).toBe("Bug 1");
        });

        it("returns 200 for USER with project membership", async () => {
            const token = await signUserToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/issues",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);
        });
    });

    describe("GET /api/issues/:id", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/issues/1",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 with issue details for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/issues/1",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ id: number; title: string; projectName: string }>(response.payload);
            expect(body.id).toBe(1);
            expect(body.title).toBe("Bug 1");
            expect(body.projectName).toBe("Project A");
        });
    });

    describe("GET /api/projects/:id/issues", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/projects/1/issues",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 with project issues for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/projects/1/issues",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{
                issues: Array<{ id: number; title: string }>;
                total: number;
            }>(response.payload);

            expect(body.issues).toHaveLength(2);
            expect(body.total).toBe(2);
        });

        it("returns 403 for USER without project membership", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.projectMember.findUnique as any) = async () => null;

            const token = await signUserToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/projects/1/issues",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(403);
        });
    });

    describe("POST /api/projects/:id/issues", () => {
        it("returns 200 and creates issue for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "POST",
                url: "/api/projects/1/issues",
                headers: { authorization: `Bearer ${token}` },
                payload: { title: "New Bug", category: "BUG", priority: "GENERAL" },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ id: number; title: string }>(response.payload);
            expect(body.title).toBe("New Bug");
            expect(body.id).toBeDefined();
        });

        it("returns 400 for invalid body", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "POST",
                url: "/api/projects/1/issues",
                headers: { authorization: `Bearer ${token}` },
                payload: { title: "", category: "INVALID" },
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe("PATCH /api/issues/:id", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "PATCH",
                url: "/api/issues/1",
                payload: { title: "Updated Bug" },
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 and updates issue for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "PATCH",
                url: "/api/issues/1",
                headers: { authorization: `Bearer ${token}` },
                payload: { title: "Updated Bug" },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ id: number; title: string }>(response.payload);
            expect(body.title).toBe("Updated Bug");
        });
    });

    describe("DELETE /api/issues/:id", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "DELETE",
                url: "/api/issues/1",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 and deletes issue for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "DELETE",
                url: "/api/issues/1",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);
        });
    });

    describe("GET /api/issues/export", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/issues/export",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 with exported issues for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/issues/export",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{
                issues: Array<{ id: number; title: string }>;
            }>(response.payload);

            expect(body.issues).toHaveLength(2);
            expect(body.issues[0]!.title).toBe("Bug 1");
            expect(body.issues[1]!.title).toBe("Bug 2");
        });
    });
});