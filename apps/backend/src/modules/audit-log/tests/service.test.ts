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

import { getAuditLogListService, getAuditLogExportService } from "../service.js";

const mockLogs = [
    {
        id: 1,
        eventType: "CREATE",
        subjectType: "USER",
        objectType: "PROJECT",
        subjectId: 1,
        objectId: 10,
        oldValue: null,
        newValue: '{"name":"Project A"}',
        createdAt: new Date("2025-01-15T10:00:00.000Z"),
        subject: { login: "admin@example.com" },
    },
    {
        id: 2,
        eventType: "UPDATE",
        subjectType: "USER",
        objectType: "ISSUE",
        subjectId: 2,
        objectId: 20,
        oldValue: '{"status":"OPEN"}',
        newValue: '{"status":"IN_PROGRESS"}',
        createdAt: new Date("2025-01-16T12:00:00.000Z"),
        subject: { login: "user@example.com" },
    },
];

const buildTestApp = async () => {
    const fastify = defaultBuildTestApp();

    await fastify.register(cookiePlugin);
    await fastify.register(jwtPlugin);

    // Mock prisma with $transaction, auditLog.findMany, and auditLog.count
    const mockPrisma = {
        $transaction: vi.fn(async (queries: Promise<unknown>[]) => {
            const results = await Promise.all(queries);
            return results;
        }),
        auditLog: {
            findMany: vi.fn(async () => mockLogs),
            count: vi.fn(async () => mockLogs.length),
        },
        issue: {
            findMany: vi.fn(async () => []),
        },
        projectMember: {
            findMany: vi.fn(async () => []),
            count: vi.fn(async () => 0),
        },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock, does not need full PrismaClient
    fastify.decorate("prisma", mockPrisma as any);

    return fastify;
};

const getResponseJson = <T>(payload: string): T => JSON.parse(payload) as T;

describe("getAuditLogListService", () => {
    let app: Awaited<ReturnType<typeof buildTestApp>>;

    beforeEach(async () => {
        vi.clearAllMocks();
        app = await buildTestApp();
    });

    afterEach(async () => {
        await app?.close();
    });

    it("returns 200 with empty logs array when no data", async () => {
        // Override prisma to return empty data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
        (app.prisma.auditLog.findMany as any) = async () => [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
        (app.prisma.auditLog.count as any) = async () => 0;

        const token = await app.jwt.sign(
            {
                sub: "1",
                login: "admin@example.com",
                role: Role.ADMIN,
            } satisfies JwtPayload,
        );

        const request = {
            server: app,
            query: { page: 1, perPage: 20, sortBy: undefined, sortOrder: "desc", filter: undefined },
            user: { sub: "1", role: Role.ADMIN, login: "admin@example.com" },
        } as any;

        const result = await getAuditLogListService(request);

        expect(result.logs).toEqual([]);
        expect(result.total).toBe(0);
        expect(result.page).toBe(1);
        expect(result.perPage).toBe(20);
    });

    it("returns logs and pagination info", async () => {
        const token = await app.jwt.sign(
            {
                sub: "1",
                login: "admin@example.com",
                role: Role.ADMIN,
            } satisfies JwtPayload,
        );

        const request = {
            server: app,
            query: { page: 1, perPage: 20, sortBy: undefined, sortOrder: "desc", filter: undefined },
            user: { sub: "1", role: Role.ADMIN, login: "admin@example.com" },
        } as any;

        const result = await getAuditLogListService(request);

        expect(result.logs).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.page).toBe(1);
        expect(result.perPage).toBe(20);
        expect(result.logs[0]!.subjectLogin).toBe("admin@example.com");
        expect(result.logs[1]!.subjectLogin).toBe("user@example.com");
    });

    it("returns correct pagination for page=2&perPage=5", async () => {
        // Track skip/take to verify pagination
        let capturedSkip = 0;
        let capturedTake = 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
        (app.prisma.auditLog.findMany as any) = async (args: { skip?: number; take?: number }) => {
            capturedSkip = args.skip ?? 0;
            capturedTake = args.take ?? 20;
            return mockLogs;
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
        (app.prisma.auditLog.count as any) = async () => 50;

        const request = {
            server: app,
            query: { page: 2, perPage: 5, sortBy: undefined, sortOrder: "desc", filter: undefined },
            user: { sub: "1", role: Role.ADMIN, login: "admin@example.com" },
        } as any;

        const result = await getAuditLogListService(request);

        expect(capturedSkip).toBe(5);
        expect(capturedTake).toBe(5);
        expect(result.total).toBe(50);
        expect(result.page).toBe(2);
        expect(result.perPage).toBe(5);
    });

    it("returns sorted data for sortBy=eventType&sortOrder=asc", async () => {
        let capturedOrderBy: unknown = null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
        (app.prisma.auditLog.findMany as any) = async (args: { orderBy?: unknown }) => {
            capturedOrderBy = args.orderBy ?? null;
            return mockLogs;
        };

        const request = {
            server: app,
            query: { page: 1, perPage: 20, sortBy: "eventType", sortOrder: "asc", filter: undefined },
            user: { sub: "1", role: Role.ADMIN, login: "admin@example.com" },
        } as any;

        const result = await getAuditLogListService(request);

        expect(capturedOrderBy).toEqual({ eventType: "asc" });
    });

    it("defaults to createdAt desc when sortBy is not allowed", async () => {
        let capturedOrderBy: unknown = null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
        (app.prisma.auditLog.findMany as any) = async (args: { orderBy?: unknown }) => {
            capturedOrderBy = args.orderBy ?? null;
            return mockLogs;
        };

        const request = {
            server: app,
            query: { page: 1, perPage: 20, sortBy: "nonExistentField", sortOrder: "asc", filter: undefined },
            user: { sub: "1", role: Role.ADMIN, login: "admin@example.com" },
        } as any;

        await getAuditLogListService(request);

        expect(capturedOrderBy).toEqual({ createdAt: "desc" });
    });

    it("queries project issues for MANAGER role and builds role-based where clause", async () => {
        let capturedWhere: unknown = null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
        (app.prisma.issue.findMany as any) = async () => [{ id: 100, projectId: 10 }];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
        (app.prisma.auditLog.findMany as any) = async (args: { where?: unknown }) => {
            capturedWhere = args.where ?? {};
            return mockLogs;
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
        (app.prisma.auditLog.count as any) = async () => 2;

        const request = {
            server: app,
            query: { page: 1, perPage: 20, sortBy: undefined, sortOrder: "desc", filter: undefined },
            user: { sub: "5", role: Role.USER, login: "manager@example.com" },
        } as any;

        const result = await getAuditLogListService(request);

        expect(result.logs).toHaveLength(2);
        expect(capturedWhere).toEqual({
            OR: [
                { objectType: "PROJECT", objectId: { in: [] } },
                { objectType: "ISSUE", objectId: { in: [100] } },
            ],
        });
    });

    it("transforms log entries to include subjectLogin and ISO date string", async () => {
        const request = {
            server: app,
            query: { page: 1, perPage: 20, sortBy: undefined, sortOrder: "desc", filter: undefined },
            user: { sub: "1", role: Role.ADMIN, login: "admin@example.com" },
        } as any;

        const result = await getAuditLogListService(request);

        const log = result.logs[0]!;
        expect(log).toHaveProperty("id");
        expect(log).toHaveProperty("eventType");
        expect(log).toHaveProperty("subjectType");
        expect(log).toHaveProperty("objectType");
        expect(log).toHaveProperty("subjectId");
        expect(log).toHaveProperty("objectId");
        expect(log).toHaveProperty("subjectLogin");
        expect(log).toHaveProperty("createdAt");
        expect(typeof log.createdAt).toBe("string");
        expect(log.createdAt).toBe("2025-01-15T10:00:00.000Z");
    });

    it("uses $transaction for list queries", async () => {
        const request = {
            server: app,
            query: { page: 1, perPage: 20, sortBy: undefined, sortOrder: "desc", filter: undefined },
            user: { sub: "1", role: Role.ADMIN, login: "admin@example.com" },
        } as any;

        await getAuditLogListService(request);

        expect(app.prisma.$transaction).toHaveBeenCalled();
    });
});

describe("getAuditLogExportService", () => {
    let app: Awaited<ReturnType<typeof buildTestApp>>;

    beforeEach(async () => {
        vi.clearAllMocks();
        app = await buildTestApp();
    });

    afterEach(async () => {
        await app?.close();
    });

    it("returns exported logs without pagination", async () => {
        const request = {
            server: app,
            query: { filter: undefined, sortBy: undefined, sortOrder: "desc" },
            user: { sub: "1", role: Role.ADMIN, login: "admin@example.com" },
        } as any;

        const result = await getAuditLogExportService(request);

        expect(result.logs).toHaveLength(2);
        expect(result.logs[0]!.subjectLogin).toBe("admin@example.com");
        expect(result.logs[1]!.subjectLogin).toBe("user@example.com");
    });

    it("calls findMany without skip/take for export", async () => {
        let capturedArgs: Record<string, unknown> = {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
        (app.prisma.auditLog.findMany as any) = async (args: Record<string, unknown>) => {
            capturedArgs = args;
            return mockLogs;
        };

        const request = {
            server: app,
            query: { filter: undefined, sortBy: undefined, sortOrder: "desc" },
            user: { sub: "1", role: Role.ADMIN, login: "admin@example.com" },
        } as any;

        await getAuditLogExportService(request);

        expect(capturedArgs.skip).toBeUndefined();
        expect(capturedArgs.take).toBeUndefined();
    });

    it("applies sortBy to export orderBy", async () => {
        let capturedOrderBy: unknown = null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
        (app.prisma.auditLog.findMany as any) = async (args: { orderBy?: unknown }) => {
            capturedOrderBy = args.orderBy ?? null;
            return mockLogs;
        };

        const request = {
            server: app,
            query: { filter: undefined, sortBy: "subjectType", sortOrder: "asc" },
            user: { sub: "1", role: Role.ADMIN, login: "admin@example.com" },
        } as any;

        await getAuditLogExportService(request);

        expect(capturedOrderBy).toEqual({ subjectType: "asc" });
    });

    it("transforms export log entries with correct field mapping", async () => {
        const request = {
            server: app,
            query: { filter: undefined, sortBy: undefined, sortOrder: "desc" },
            user: { sub: "1", role: Role.ADMIN, login: "admin@example.com" },
        } as any;

        const result = await getAuditLogExportService(request);

        const log = result.logs[0]!;
        expect(log.id).toBe(1);
        expect(log.eventType).toBe("CREATE");
        expect(log.subjectType).toBe("USER");
        expect(log.objectType).toBe("PROJECT");
        expect(log.subjectId).toBe(1);
        expect(log.objectId).toBe(10);
        expect(log.oldValue).toBeNull();
        expect(log.newValue).toBe('{"name":"Project A"}');
        expect(log.createdAt).toBe("2025-01-15T10:00:00.000Z");
    });

    it("queries project issues for MANAGER role in export", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
        (app.prisma.issue.findMany as any) = vi.fn(async () => [{ id: 200, projectId: 20 }]);

        const request = {
            server: app,
            query: { filter: undefined, sortBy: undefined, sortOrder: "desc" },
            user: { sub: "5", role: Role.USER, login: "manager@example.com" },
        } as any;

        const result = await getAuditLogExportService(request);

        expect(app.prisma.issue.findMany).toHaveBeenCalled();
        expect(result.logs).toHaveLength(2);
    });

    it("does not call $transaction for export queries", async () => {
        const request = {
            server: app,
            query: { filter: undefined, sortBy: undefined, sortOrder: "desc" },
            user: { sub: "1", role: Role.ADMIN, login: "admin@example.com" },
        } as any;

        await getAuditLogExportService(request);

        expect(app.prisma.$transaction).not.toHaveBeenCalled();
    });
});
