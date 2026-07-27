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
    getUsersService,
    getUsersExportService,
    createUserService,
    updateUserService,
    deleteUserService,
} from "../service.js";

vi.mock("@/modules/audit-log/emitter.js", () => ({
    auditLogEmitter: {
        emitAuditLog: vi.fn().mockResolvedValue(undefined),
    },
}));

const buildTestApp = async () => {
    const fastify = defaultBuildTestApp();

    const mockUsers = [
        { id: 1, login: "admin@example.com", role: Role.ADMIN, createdAt: new Date("2025-01-01T00:00:00.000Z") },
        { id: 2, login: "user@example.com", role: Role.USER, createdAt: new Date("2025-01-02T00:00:00.000Z") },
    ];

    let nextId = 3;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    const mockPrisma: any = {
        $transaction: async (queries: Promise<unknown>[]) => {
            const results = await Promise.all(queries);
            return results;
        },
        user: {
            findMany: async (args?: { where?: Record<string, unknown>; skip?: number; take?: number; orderBy?: Record<string, unknown> }) => {
                let filtered = [...mockUsers];
                if (args?.where?.deletedAt === null) {
                    // no-op, all mock users are not deleted
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
    };

    fastify.decorate("prisma", mockPrisma);

    return fastify;
};

const buildRequest = (app: Awaited<ReturnType<typeof buildTestApp>>, overrides: Record<string, unknown> = {}) =>
    ({
        server: app,
        user: { sub: "1", login: "admin@example.com", role: Role.ADMIN },
        query: { page: 1, perPage: 20, sortBy: undefined, sortOrder: "asc", filter: undefined },
        body: {},
        params: {},
        ...overrides,
    }) as any;

describe("usersPage service", () => {
    let app: Awaited<ReturnType<typeof buildTestApp>>;

    beforeEach(async () => {
        app = await buildTestApp();
        vi.clearAllMocks();
    });

    afterEach(async () => {
        await app?.close();
    });

    describe("getUsersService", () => {
        it("returns users with pagination info", async () => {
            const request = buildRequest(app);

            const result = await getUsersService(request);

            expect(result.users).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.perPage).toBe(20);
            expect(result.users[0]!.login).toBe("admin@example.com");
            expect(result.users[0]!.role).toBe(Role.ADMIN);
        });

        it("passes correct pagination params to prisma", async () => {
            let capturedSkip = 0;
            let capturedTake = 0;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.user.findMany as any) = async (args: { skip?: number; take?: number }) => {
                capturedSkip = args.skip ?? 0;
                capturedTake = args.take ?? 20;
                return [
                    { id: 3, login: "page2@example.com", role: Role.USER, createdAt: new Date() },
                ];
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.user.count as any) = async () => 50;

            const request = buildRequest(app, {
                query: { page: 2, perPage: 5, sortBy: undefined, sortOrder: "asc", filter: undefined },
            });

            const result = await getUsersService(request);

            expect(capturedSkip).toBe(5);
            expect(capturedTake).toBe(5);
            expect(result.total).toBe(50);
            expect(result.page).toBe(2);
            expect(result.perPage).toBe(5);
        });
    });

    describe("getUsersExportService", () => {
        it("returns users without pagination", async () => {
            const request = buildRequest(app, {
                query: { filter: undefined, sortBy: undefined, sortOrder: "asc" },
            });

            const result = await getUsersExportService(request);

            expect(result.users).toHaveLength(2);
            expect(result.users[0]!.login).toBe("admin@example.com");
            expect(result.users[1]!.login).toBe("user@example.com");
        });
    });

    describe("createUserService", () => {
        it("creates a new user and emits audit log", async () => {
            const request = buildRequest(app, {
                body: { login: "new@example.com", password: "secret123", role: Role.USER },
            });

            const result = await createUserService(request);

            expect(result.login).toBe("new@example.com");
            expect(result.role).toBe(Role.USER);
            expect(result.id).toBeDefined();
            expect(auditLogEmitter.emitAuditLog).toHaveBeenCalledWith(app.prisma, expect.objectContaining({
                eventType: "USER_CREATED",
                subjectType: "USER",
                objectType: "USER",
            }));
        });

        it("throws 409 for duplicate login", async () => {
            const request = buildRequest(app, {
                body: { login: "admin@example.com", password: "secret123", role: Role.USER },
            });

            await expect(createUserService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.CONFLICT, "Login already taken", "USER_LOGIN_EXISTS"),
            );
        });
    });

    describe("updateUserService", () => {
        it("updates user login", async () => {
            const request = buildRequest(app, {
                params: { id: 2 },
                body: { login: "updated@example.com" },
            });

            const result = await updateUserService(request);

            expect(result.login).toBe("updated@example.com");
            expect(auditLogEmitter.emitAuditLog).toHaveBeenCalledWith(app.prisma, expect.objectContaining({
                eventType: "USER_UPDATED",
            }));
        });

        it("updates user role", async () => {
            const request = buildRequest(app, {
                params: { id: 2 },
                body: { role: Role.ADMIN },
            });

            const result = await updateUserService(request);

            expect(result.role).toBe(Role.ADMIN);
        });

        it("throws 404 for non-existent user", async () => {
            const request = buildRequest(app, {
                params: { id: 999 },
                body: { login: "new-login" },
            });

            await expect(updateUserService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.NOT_FOUND, "User not found", "USER_NOT_FOUND"),
            );
        });

        it("throws 409 when login is already taken by another user", async () => {
            const request = buildRequest(app, {
                params: { id: 2 },
                body: { login: "admin@example.com" },
            });

            await expect(updateUserService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.CONFLICT, "Login already taken", "USER_LOGIN_EXISTS"),
            );
        });

        it("throws 400 when no fields to update", async () => {
            const request = buildRequest(app, {
                params: { id: 2 },
                body: {},
            });

            await expect(updateUserService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.BAD_REQUEST, "No fields to update", "NO_FIELDS_TO_UPDATE"),
            );
        });

        it("allows updating login to the same value", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                body: { login: "admin@example.com" },
            });

            const result = await updateUserService(request);

            expect(result.login).toBe("admin@example.com");
        });

        it("throws 403 when demoting the last admin", async () => {
            // Mock prisma.user.count to return 1 (last admin)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.user.count as any) = async () => 1;

            const request = buildRequest(app, {
                params: { id: 1 },
                body: { role: Role.USER },
            });

            await expect(updateUserService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.FORBIDDEN, "Cannot remove the last member with this role", "LAST_ADMIN"),
            );
        });
    });

    describe("deleteUserService", () => {
        it("soft-deletes a user and emits audit log", async () => {
            const request = buildRequest(app, {
                params: { id: 2 },
                user: { sub: "1", login: "admin@example.com", role: Role.ADMIN },
            });

            const result = await deleteUserService(request);

            expect(result).toBeNull();
            expect(auditLogEmitter.emitAuditLog).toHaveBeenCalledWith(app.prisma, expect.objectContaining({
                eventType: "USER_DELETED",
                subjectType: "USER",
                objectType: "USER",
            }));
        });

        it("throws 404 for non-existent user", async () => {
            const request = buildRequest(app, {
                params: { id: 999 },
                user: { sub: "1", login: "admin@example.com", role: Role.ADMIN },
            });

            await expect(deleteUserService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.NOT_FOUND, "User not found", "USER_NOT_FOUND"),
            );
        });

        it("throws 403 when trying to delete yourself", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                user: { sub: "1", login: "admin@example.com", role: Role.ADMIN },
            });

            await expect(deleteUserService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.FORBIDDEN, "Cannot delete yourself", "SELF_DELETE"),
            );
        });

        it("throws 403 when deleting the last admin", async () => {
            // Make the target user an admin
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.user.findUnique as any) = async (args: { where: Record<string, unknown> }) => {
                if ("id" in args.where && args.where.id === 2) {
                    return { id: 2, login: "user@example.com", role: Role.ADMIN };
                }
                return null;
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.user.count as any) = async () => 1;

            const request = buildRequest(app, {
                params: { id: 2 },
                user: { sub: "1", login: "admin@example.com", role: Role.ADMIN },
            });

            await expect(deleteUserService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.FORBIDDEN, "Cannot remove the last member with this role", "LAST_ADMIN"),
            );
        });
    });
});
