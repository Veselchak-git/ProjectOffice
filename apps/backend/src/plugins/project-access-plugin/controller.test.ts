/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Role } from "@/generated/prisma/client.js";
import { ProjectMemberRole } from "@/generated/prisma/enums.js";

import { defaultBuildTestApp } from "@/shared/lib/testing/defaultBuildTestApp.test-helper.js";

import { cookiePlugin } from "@/plugins/cookie-plugin/index.js";
import { jwtPlugin } from "@/plugins/jwt-plugin/index.js";
import type { JwtPayload } from "@/plugins/jwt-plugin/model.js";

import { createProjectAccessGuard, projectAccessPlugin } from "./index.js";

const buildTestApp = async () => {
    const fastify = defaultBuildTestApp();

    await fastify.register(cookiePlugin);
    await fastify.register(jwtPlugin);
    await fastify.register(projectAccessPlugin);

    // Mock prisma
    fastify.decorate("prisma", {
        project: {
            findUnique: async ({ where }: { where: { id: number } }) => {
                if (where.id === 1) return { id: 1 };
                return null;
            },
        },
        projectMember: {
            findUnique: async () => null,
        },
    });

    return fastify;
};

const getResponseJson = <T>(payload: string): T => JSON.parse(payload) as T;

describe("projectAccessPlugin integration", () => {
    let app: Awaited<ReturnType<typeof buildTestApp>>;

    beforeEach(async () => {
        app = await buildTestApp();
    });

    afterEach(async () => {
        await app?.close();
    });

    it("returns 401 without auth token", async () => {
        app.get("/projects/:id/members", {
            preHandler: [app.authenticate, createProjectAccessGuard({ allowGlobalAdmin: true })],
        }, async () => ({ status: "ok" }));

        const response = await app.inject({
            method: "GET",
            url: "/projects/1/members",
        });

        expect(response.statusCode).toBe(401);
    });

    it("allows ADMIN to bypass access check", async () => {
        app.get("/projects/:id/members", {
            preHandler: [app.authenticate, createProjectAccessGuard({ allowGlobalAdmin: true })],
        }, async () => ({ status: "ok" }));

        const token = await app.jwt.sign({
            sub: "1",
            login: "admin@example.com",
            role: Role.ADMIN,
        } satisfies JwtPayload);

        const response = await app.inject({
            method: "GET",
            url: "/projects/1/members",
            headers: { authorization: `Bearer ${token}` },
        });

        expect(response.statusCode).toBe(200);
        expect(getResponseJson<{ status: string }>(response.payload)).toEqual({ status: "ok" });
    });

    it("returns 403 for non-member USER", async () => {
        app.get("/projects/:id/members", {
            preHandler: [app.authenticate, createProjectAccessGuard({ allowGlobalAdmin: true })],
        }, async () => ({ status: "ok" }));

        const token = await app.jwt.sign({
            sub: "2",
            login: "user@example.com",
            role: Role.USER,
        } satisfies JwtPayload);

        const response = await app.inject({
            method: "GET",
            url: "/projects/1/members",
            headers: { authorization: `Bearer ${token}` },
        });

        expect(response.statusCode).toBe(403);
    });

    it("allows member with correct role", async () => {
        // Override prisma to return a member
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (app.prisma.projectMember.findUnique as any) = async () => ({
            userId: 2,
            projectId: 1,
            role: ProjectMemberRole.DEVELOPER,
        });

        app.get("/projects/:id/members", {
            preHandler: [app.authenticate, createProjectAccessGuard({ allowGlobalAdmin: true })],
        }, async () => ({ status: "ok" }));

        const token = await app.jwt.sign({
            sub: "2",
            login: "dev@example.com",
            role: Role.USER,
        } satisfies JwtPayload);

        const response = await app.inject({
            method: "GET",
            url: "/projects/1/members",
            headers: { authorization: `Bearer ${token}` },
        });

        expect(response.statusCode).toBe(200);
        expect(getResponseJson<{ status: string }>(response.payload)).toEqual({ status: "ok" });
    });

    it("returns 403 for member without required role", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (app.prisma.projectMember.findUnique as any) = async () => ({
            userId: 3,
            projectId: 1,
            role: ProjectMemberRole.VIEWER,
        });

        app.get("/projects/:id/members", {
            preHandler: [app.authenticate, createProjectAccessGuard({
                allowGlobalAdmin: true,
                requiredRoles: [ProjectMemberRole.DEVELOPER],
            })],
        }, async () => ({ status: "ok" }));

        const token = await app.jwt.sign({
            sub: "3",
            login: "viewer@example.com",
            role: Role.USER,
        } satisfies JwtPayload);

        const response = await app.inject({
            method: "GET",
            url: "/projects/1/members",
            headers: { authorization: `Bearer ${token}` },
        });

        expect(response.statusCode).toBe(403);
    });
});
