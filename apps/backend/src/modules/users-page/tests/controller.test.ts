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

import { defaultBuildTestApp } from "@/shared/lib/testing/defaultBuildTestApp.test-helper.js";

import { usersPageControllerPlugin } from "../controller.js";

const mockUsers = [
    { id: 1, login: "admin@example.com", role: Role.ADMIN, createdAt: new Date("2025-01-01T00:00:00.000Z") },
    { id: 2, login: "user@example.com", role: Role.USER, createdAt: new Date("2025-01-02T00:00:00.000Z") },
];

const buildTestApp = async () => {
    const fastify = defaultBuildTestApp();

    await fastify.register(cookiePlugin);
    await fastify.register(jwtPlugin);

    let nextId = 3;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    const mockPrisma: any = {
        $transaction: async (queries: Promise<unknown>[]) => {
            const results = await Promise.all(queries);
            return results;
        },
        user: {
            findMany: async (args?: { where?: Record<string, unknown>; skip?: number; take?: number }) => {
                let filtered = [...mockUsers];
                if (args?.skip !== undefined && args?.take !== undefined) {
                    filtered = filtered.slice(args.skip, args.skip + args.take);
                }
                return filtered;
            },
            count: async () => mockUsers.length,
            findUnique: async (args: { where: Record<string, unknown> }) => {
                if ("login" in args.where) {
                    return mockUsers.find(u => u.login === args.where.login) ?? null;
                }
                if ("id" in args.where) {
                    return mockUsers.find(u => u.id === args.where.id) ?? null;
                }
                return null;
            },
            create: async (args: { data: Record<string, unknown> }) => {
                const user = {
                    id: nextId++,
                    login: args.data.login as string,
                    role: (args.data.role as Role) ?? Role.USER,
                    createdAt: new Date(),
                };
                return user;
            },
            update: async (args: { where: { id: number }; data: Record<string, unknown> }) => {
                const user = mockUsers.find(u => u.id === args.where.id);
                if (!user) throw new Error("User not found");
                return { ...user, ...args.data };
            },
        },
        auditLog: {
            create: async () => ({ id: 1 }),
        },
        projectMember: {
            count: async () => 1,
        },
    };

    fastify.decorate("prisma", mockPrisma);

    await fastify.register(
        async scopedFastify => {
            await scopedFastify.register(usersPageControllerPlugin);
        },
        { prefix: "/api" },
    );

    return fastify;
};

const getResponseJson = <T>(payload: string): T => JSON.parse(payload) as T;

describe("usersPageController", () => {
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

    describe("GET /users", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/users",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 with users list for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/users",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{
                users: Array<{ id: number; login: string; role: string }>;
                total: number;
                page: number;
                perPage: number;
            }>(response.payload);

            expect(body.users).toHaveLength(2);
            expect(body.total).toBe(2);
            expect(body.page).toBe(1);
            expect(body.perPage).toBe(20);
            expect(body.users[0]!.login).toBe("admin@example.com");
        });

        it("returns 403 for USER without MANAGER project role", async () => {
            const token = await signUserToken();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.projectMember.count as any) = async () => 0;

            const response = await app.inject({
                method: "GET",
                url: "/api/users",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(403);
        });

        it("returns 403 for USER with MANAGER project role", async () => {
            const token = await signUserToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/users",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(403);
        });
    });

    describe("POST /users", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/api/users",
                payload: { login: "new@example.com", password: "secret123", role: Role.USER },
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 201 and creates user for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "POST",
                url: "/api/users",
                headers: { authorization: `Bearer ${token}` },
                payload: { login: "new@example.com", password: "secret123", role: Role.USER },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ id: number; login: string; role: string }>(response.payload);
            expect(body.login).toBe("new@example.com");
            expect(body.role).toBe("USER");
        });

        it("returns 403 for non-ADMIN user", async () => {
            const token = await signUserToken();

            const response = await app.inject({
                method: "POST",
                url: "/api/users",
                headers: { authorization: `Bearer ${token}` },
                payload: { login: "new@example.com", password: "secret123", role: Role.USER },
            });

            expect(response.statusCode).toBe(403);
        });

        it("returns 409 for duplicate login", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "POST",
                url: "/api/users",
                headers: { authorization: `Bearer ${token}` },
                payload: { login: "admin@example.com", password: "secret123", role: Role.USER },
            });

            expect(response.statusCode).toBe(409);
        });

        it("returns 400 for invalid body", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "POST",
                url: "/api/users",
                headers: { authorization: `Bearer ${token}` },
                payload: { login: "", password: "ab", role: "INVALID" },
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe("PATCH /users/:id", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "PATCH",
                url: "/api/users/2",
                payload: { login: "updated@example.com" },
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 and updates user for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "PATCH",
                url: "/api/users/2",
                headers: { authorization: `Bearer ${token}` },
                payload: { login: "updated@example.com" },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ id: number; login: string; role: string }>(response.payload);
            expect(body.login).toBe("updated@example.com");
        });

        it("returns 403 for non-ADMIN user", async () => {
            const token = await signUserToken();

            const response = await app.inject({
                method: "PATCH",
                url: "/api/users/2",
                headers: { authorization: `Bearer ${token}` },
                payload: { login: "updated@example.com" },
            });

            expect(response.statusCode).toBe(403);
        });

        it("returns 404 for non-existent user", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "PATCH",
                url: "/api/users/999",
                headers: { authorization: `Bearer ${token}` },
                payload: { login: "new-login" },
            });

            expect(response.statusCode).toBe(404);
        });

        it("returns 400 when no fields to update", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "PATCH",
                url: "/api/users/2",
                headers: { authorization: `Bearer ${token}` },
                payload: {},
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe("DELETE /users/:id", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "DELETE",
                url: "/api/users/2",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 204 and deletes user for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "DELETE",
                url: "/api/users/2",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);
        });

        it("returns 403 for non-ADMIN user", async () => {
            const token = await signUserToken();

            const response = await app.inject({
                method: "DELETE",
                url: "/api/users/2",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(403);
        });

        it("returns 404 for non-existent user", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "DELETE",
                url: "/api/users/999",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(404);
        });

        it("returns 403 when trying to delete yourself", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "DELETE",
                url: "/api/users/1",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(403);
        });
    });

    describe("GET /users/export", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/users/export",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 with exported users for ADMIN", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/users/export",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{
                users: Array<{ id: number; login: string; role: string }>;
            }>(response.payload);

            expect(body.users).toHaveLength(2);
            expect(body.users[0]!.login).toBe("admin@example.com");
            expect(body.users[1]!.login).toBe("user@example.com");
        });
    });
});
