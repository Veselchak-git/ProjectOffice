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

import { auditLogControllerPlugin } from "../controller.js";

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
        $transaction: async (queries: Promise<unknown>[]) => {
            const results = await Promise.all(queries);
            return results;
        },
        auditLog: {
            findMany: async () => mockLogs,
            count: async () => mockLogs.length,
        },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock, does not need full PrismaClient
    fastify.decorate("prisma", mockPrisma as any);

    await fastify.register(
        async scopedFastify => {
            await scopedFastify.register(auditLogControllerPlugin);
        },
        { prefix: "/api" }
    );

    return fastify;
};

const getResponseJson = <T>(payload: string): T => JSON.parse(payload) as T;

describe("auditLogController", () => {
    let app: Awaited<ReturnType<typeof buildTestApp>>;

    beforeEach(async () => {
        app = await buildTestApp();
    });

    afterEach(async () => {
        await app?.close();
    });

    it("returns 401 without auth token", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/api/audit-log",
        });

        expect(response.statusCode).toBe(401);
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

        const response = await app.inject({
            method: "GET",
            url: "/api/audit-log",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = getResponseJson<{
            logs: unknown[];
            total: number;
            page: number;
            perPage: number;
        }>(response.payload);

        expect(body.logs).toEqual([]);
        expect(body.total).toBe(0);
        expect(body.page).toBe(1);
        expect(body.perPage).toBe(20);
    });

    it("returns 200 with logs and pagination info", async () => {
        const token = await app.jwt.sign(
            {
                sub: "1",
                login: "admin@example.com",
                role: Role.ADMIN,
            } satisfies JwtPayload,
        );

        const response = await app.inject({
            method: "GET",
            url: "/api/audit-log",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = getResponseJson<{
            logs: Array<{ id: number; eventType: string; subjectLogin: string }>;
            total: number;
            page: number;
            perPage: number;
        }>(response.payload);

        expect(body.logs).toHaveLength(2);
        expect(body.total).toBe(2);
        expect(body.page).toBe(1);
        expect(body.perPage).toBe(20);
        expect(body.logs[0]!.subjectLogin).toBe("admin@example.com");
        expect(body.logs[1]!.subjectLogin).toBe("user@example.com");
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

        const token = await app.jwt.sign(
            {
                sub: "1",
                login: "admin@example.com",
                role: Role.ADMIN,
            } satisfies JwtPayload,
        );

        const response = await app.inject({
            method: "GET",
            url: "/api/audit-log?page=2&perPage=5",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        expect(capturedSkip).toBe(5);
        expect(capturedTake).toBe(5);

        const body = getResponseJson<{
            total: number;
            page: number;
            perPage: number;
        }>(response.payload);

        expect(body.total).toBe(50);
        expect(body.page).toBe(2);
        expect(body.perPage).toBe(5);
    });

    it("returns sorted data for sortBy=eventType&sortOrder=asc", async () => {
        let capturedOrderBy: unknown = null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
        (app.prisma.auditLog.findMany as any) = async (args: { orderBy?: unknown }) => {
            capturedOrderBy = args.orderBy ?? null;
            return mockLogs;
        };

        const token = await app.jwt.sign(
            {
                sub: "1",
                login: "admin@example.com",
                role: Role.ADMIN,
            } satisfies JwtPayload,
        );

        const response = await app.inject({
            method: "GET",
            url: "/api/audit-log?sortBy=eventType&sortOrder=asc",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);
        expect(capturedOrderBy).toEqual({ eventType: "asc" });
    });
});
