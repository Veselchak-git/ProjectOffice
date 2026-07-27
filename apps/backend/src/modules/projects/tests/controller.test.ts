/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * �������������� ����� (c) 2016-2026 ����������� ��� �����
 * ��� ����� ��������
 */
import { Role } from "@/generated/prisma/client.js";

import type { JwtPayload } from "@/plugins/jwt-plugin/model.js";

import { cookiePlugin } from "@/plugins/cookie-plugin/index.js";
import { jwtPlugin } from "@/plugins/jwt-plugin/index.js";
import { projectAccessPlugin } from "@/plugins/project-access-plugin/index.js";

import { defaultBuildTestApp } from "@/shared/lib/testing/defaultBuildTestApp.test-helper.js";

import { auditLogEmitter } from "@/modules/audit-log/emitter.js";

import { projectsControllerPlugin } from "../controller.js";

vi.mock("@/modules/audit-log/emitter.js", () => ({
    auditLogEmitter: {
        emitAuditLog: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock("@/shared/lib/assert-last-role/index.js", () => ({
    assertNotLastOfRole: vi.fn().mockResolvedValue(undefined),
}));

const mockProjects = [
    {
        id: 1,
        name: "Project A",
        description: "Desc A",
        status: "ACTIVE",
        createdAt: new Date("2025-01-01"),
        _count: { versions: 2, issues: 5 },
        memberships: [{ role: "MANAGER", user: { login: "admin@example.com" } }],
        versions: [{ id: 1, version: "1.0" }, { id: 2, version: "2.0" }],
    },
    {
        id: 2,
        name: "Project B",
        description: "Desc B",
        status: "ARCHIVED",
        createdAt: new Date("2025-02-01"),
        _count: { versions: 1, issues: 3 },
        memberships: [{ role: "VIEWER", user: { login: "user@example.com" } }],
        versions: [{ id: 3, version: "1.0" }],
    },
];

const buildTestApp = async () => {
    const fastify = defaultBuildTestApp();

    await fastify.register(cookiePlugin);
    await fastify.register(jwtPlugin);
    await fastify.register(projectAccessPlugin);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    const mockPrisma: any = {
        $transaction: async (fn: any) => {
            if (typeof fn === "function") return fn(mockPrisma);
            const results = await Promise.all(fn);
            return results;
        },
        project: {
            findMany: async (args?: any) => {
                let filtered = [...mockProjects];
                if (args?.skip !== undefined && args?.take !== undefined) {
                    filtered = filtered.slice(args.skip, args.skip + args.take);
                }
                return filtered;
            },
            findUnique: async (args: any) => mockProjects.find((p: any) => p.id === args.where.id) ?? null,
            findFirst: async (args: any) => mockProjects.find((p: any) => p.name === args.where?.name) ?? null,
            count: async () => mockProjects.length,
            create: async (args: any) => ({ id: 3, name: args.data.name, description: args.data.description }),
            update: async (args: any) => {
                const existing = mockProjects.find((p: any) => p.id === args.where.id);
                if (existing) Object.assign(existing, args.data);
                return { ...existing, ...args.data };
            },
            delete: async () => {},
        },
        projectMember: {
            findMany: async (args: any) => {
                if (args?.where?.userId) {
                    return mockProjects
                        .flatMap((p: any) => p.memberships.map((m: any) => ({ ...m, projectId: p.id, userId: m.user.login === "admin@example.com" ? 1 : 2 })))
                        .filter((m: any) => m.userId === args.where.userId);
                }
                return [{ userId: 1, role: "MANAGER", user: { login: "admin@example.com" } }];
            },
            findUnique: async (args: any) => {
                if (args.where?.userId_projectId) {
                    const { userId, projectId } = args.where.userId_projectId;
                    if (userId === 1) return { userId: 1, projectId, role: "MANAGER", user: { login: "admin@example.com" } };
                    if (userId === 2) return { userId: 2, projectId, role: "MANAGER", user: { login: "user@example.com" } };
                }
                return null;
            },
            count: async () => 2,
            create: async (args: any) => ({
                userId: args.data.userId,
                role: args.data.role,
                user: { login: "newuser@example.com" },
            }),
            update: async (args: any) => ({
                userId: args.where.userId_projectId.userId,
                role: args.data.role,
                user: { login: "admin@example.com" },
            }),
            delete: async () => {},
            deleteMany: async () => {},
        },
        user: {
            findUnique: async (args: any) => {
                if (args.where?.id === 999) return null;
                return { id: args.where.id, login: "test@example.com", role: "USER" };
            },
        },
        productVersion: {
            deleteMany: async () => {},
            create: async (args: any) => ({ id: 1, version: args.data.version }),
        },
        issue: {
            deleteMany: async () => {},
        },
        auditLog: {
            create: async () => ({ id: 1 }),
        },
    };

    fastify.decorate("prisma", mockPrisma);

    await fastify.register(
        async scopedFastify => {
            await scopedFastify.register(projectsControllerPlugin);
        },
        { prefix: "/api" },
    );

    return fastify;
};

const getResponseJson = <T>(payload: string): T => JSON.parse(payload) as T;

describe("projectsController", () => {
    let app: Awaited<ReturnType<typeof buildTestApp>>;

    beforeEach(async () => {
        app = await buildTestApp();
        vi.clearAllMocks();
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

    describe("GET /api/projects", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/projects",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 with projects list for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/projects",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{
                projects: Array<{ id: number; name: string; status: string }>;
                total: number;
                page: number;
                perPage: number;
            }>(response.payload);

            expect(body.projects).toHaveLength(2);
            expect(body.total).toBe(2);
            expect(body.page).toBe(1);
            expect(body.perPage).toBe(20);
            expect(body.projects[0]!.name).toBe("Project A");
        });

        it("returns 200 for USER with project membership", async () => {
            const token = await signUserToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/projects",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);
        });
    });

    describe("GET /api/projects/export", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/projects/export",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 with exported projects for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/projects/export",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{
                projects: Array<{ id: number; name: string }>;
            }>(response.payload);

            expect(body.projects).toHaveLength(2);
            expect(body.projects[0]!.name).toBe("Project A");
            expect(body.projects[1]!.name).toBe("Project B");
        });
    });

    describe("GET /api/projects/:id", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/projects/1",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 with project detail for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/projects/1",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ id: number; name: string; status: string }>(response.payload);
            expect(body.id).toBe(1);
            expect(body.name).toBe("Project A");
            expect(body.status).toBe("ACTIVE");
        });

        it("returns 404 for non-existent project", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/projects/999",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(404);
        });

        it("returns 403 for USER without project membership", async () => {
            const token = await signUserToken();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.projectMember.findUnique as any) = async () => null;

            const response = await app.inject({
                method: "GET",
                url: "/api/projects/1",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(403);
        });
    });

    describe("POST /api/projects", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/api/projects",
                payload: { name: "New Project", versions: ["1.0"] },
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 and creates project for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "POST",
                url: "/api/projects",
                headers: { authorization: `Bearer ${token}` },
                payload: { name: "New Project", description: "New Desc", versions: ["1.0", "2.0"] },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ id: number; name: string }>(response.payload);
            expect(body.name).toBe("New Project");
        });

        it("returns 200 and creates project for USER", async () => {
            const token = await signUserToken();

            const response = await app.inject({
                method: "POST",
                url: "/api/projects",
                headers: { authorization: `Bearer ${token}` },
                payload: { name: "User Project", versions: ["1.0"] },
            });

            expect(response.statusCode).toBe(200);
        });

        it("returns 409 for duplicate name", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "POST",
                url: "/api/projects",
                headers: { authorization: `Bearer ${token}` },
                payload: { name: "Project A", versions: ["1.0"] },
            });

            expect(response.statusCode).toBe(409);
        });

        it("returns 400 for invalid body", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "POST",
                url: "/api/projects",
                headers: { authorization: `Bearer ${token}` },
                payload: { name: "", versions: [] },
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe("PATCH /api/projects/:id", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "PATCH",
                url: "/api/projects/1",
                payload: { name: "Updated" },
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 and updates project for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "PATCH",
                url: "/api/projects/1",
                headers: { authorization: `Bearer ${token}` },
                payload: { name: "Updated Project" },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ id: number; name: string }>(response.payload);
            expect(body.name).toBe("Updated Project");
        });

        it("returns 403 for USER without MANAGER role", async () => {
            const token = await signUserToken();

            // Override to return a non-MANAGER member
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.projectMember.findUnique as any) = async () => ({ userId: 2, projectId: 1, role: "VIEWER" });

            const response = await app.inject({
                method: "PATCH",
                url: "/api/projects/1",
                headers: { authorization: `Bearer ${token}` },
                payload: { name: "Updated" },
            });

            expect(response.statusCode).toBe(403);
        });

        it("returns 404 for non-existent project", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "PATCH",
                url: "/api/projects/999",
                headers: { authorization: `Bearer ${token}` },
                payload: { name: "New Name" },
            });

            expect(response.statusCode).toBe(404);
        });
    });

    describe("GET /api/projects/:id/members", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/projects/1/members",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 with members list for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/projects/1/members",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<Array<{ userId: number; login: string; role: string }>>(response.payload);
            expect(body).toHaveLength(1);
            expect(body[0]!.login).toBe("admin@example.com");
        });
    });

    describe("POST /api/projects/:id/members", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/api/projects/1/members",
                payload: { userId: 2, role: "VIEWER" },
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 and adds member for ADMIN", async () => {
            const token = await signAdminToken();

            // Override to allow adding new member
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.projectMember.findUnique as any) = async () => null;

            const response = await app.inject({
                method: "POST",
                url: "/api/projects/1/members",
                headers: { authorization: `Bearer ${token}` },
                payload: { userId: 2, role: "VIEWER" },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ userId: number; login: string; role: string }>(response.payload);
            expect(body.role).toBe("VIEWER");
        });

        it("returns 409 for existing member", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "POST",
                url: "/api/projects/1/members",
                headers: { authorization: `Bearer ${token}` },
                payload: { userId: 1, role: "VIEWER" },
            });

            expect(response.statusCode).toBe(409);
        });
    });

    describe("PATCH /api/projects/:id/members/:userId", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "PATCH",
                url: "/api/projects/1/members/2",
                payload: { role: "VIEWER" },
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 and updates member for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "PATCH",
                url: "/api/projects/1/members/2",
                headers: { authorization: `Bearer ${token}` },
                payload: { role: "VIEWER" },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ userId: number; role: string }>(response.payload);
            expect(body.role).toBe("VIEWER");
        });

        it("returns 403 when USER tries to modify own role (checkSelfModification)", async () => {
            const token = await signUserToken();

            const response = await app.inject({
                method: "PATCH",
                url: "/api/projects/1/members/2",
                headers: { authorization: `Bearer ${token}` },
                payload: { role: "VIEWER" },
            });

            expect(response.statusCode).toBe(403);
        });
    });

    describe("DELETE /api/projects/:id/members/:userId", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "DELETE",
                url: "/api/projects/1/members/2",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 and removes member for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "DELETE",
                url: "/api/projects/1/members/2",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);
        });

        it("returns 200 when USER removes self (allowSelfLeave)", async () => {
            const token = await signUserToken();

            const response = await app.inject({
                method: "DELETE",
                url: "/api/projects/1/members/2",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);
        });
    });

    describe("DELETE /api/projects/:id", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "DELETE",
                url: "/api/projects/1",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 and deletes project for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "DELETE",
                url: "/api/projects/1",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);
        });

        it("returns 403 for USER without MANAGER role", async () => {
            const token = await signUserToken();

            // Override to return a non-MANAGER member
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.projectMember.findUnique as any) = async () => ({ userId: 2, projectId: 1, role: "VIEWER" });

            const response = await app.inject({
                method: "DELETE",
                url: "/api/projects/1",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(403);
        });

        it("returns 404 for non-existent project", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "DELETE",
                url: "/api/projects/999",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(404);
        });
    });
});
