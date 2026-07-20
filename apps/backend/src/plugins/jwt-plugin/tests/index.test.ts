/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Role } from "@/generated/prisma/client.js";

import { defaultBuildTestApp } from "@/shared/lib/testing/defaultBuildTestApp.test-helper.js";

import { jwtPlugin } from "../index.js";
import type { JwtPayload } from "../model.js";

const buildTestApp = async () => {
    const fastify = defaultBuildTestApp();

    await fastify.register(jwtPlugin);

    fastify.get(
        "/protected",
        {
            preHandler: [fastify.authenticate]
        },
        async request => ({
            login: request.user.login
        })
    );

    fastify.get(
        "/admin-only",
        {
            preHandler: [fastify.authorize(Role.ADMIN)]
        },
        async () => ({
            status: "ok"
        })
    );

    return fastify;
};

const getResponseJson = <T>(payload: string): T => JSON.parse(payload) as T;

describe("jwtPlugin", () => {
    const instances = new Set<Awaited<ReturnType<typeof buildTestApp>>>();

    afterEach(async () => {
        await Promise.all(Array.from(instances, app => app.close()));
        instances.clear();
    });

    it("authenticate allows valid token", async () => {
        const app = await buildTestApp();
        instances.add(app);

        const accessToken = await app.jwt.sign({
            sub: "1",
            login: "student@example.com",
            role: Role.USER
        } satisfies JwtPayload);

        const response = await app.inject({
            method: "GET",
            url: "/protected",
            headers: {
                authorization: `Bearer ${accessToken}`
            }
        });

        expect(response.statusCode).toBe(200);
        expect(getResponseJson<{ login: string }>(response.payload)).toEqual({ login: "student@example.com" });
    });

    it("authenticate rejects malformed token", async () => {
        const app = await buildTestApp();
        instances.add(app);

        const response = await app.inject({
            method: "GET",
            url: "/protected",
            headers: {
                authorization: "Bearer malformed-token"
            }
        });

        expect(response.statusCode).toBe(401);
    });

    it("authorize blocks non-admin users", async () => {
        const app = await buildTestApp();
        instances.add(app);

        const accessToken = await app.jwt.sign({
            sub: "1",
            login: "student@example.com",
            role: Role.USER
        } satisfies JwtPayload);

        const response = await app.inject({
            method: "GET",
            url: "/admin-only",
            headers: {
                authorization: `Bearer ${accessToken}`
            }
        });

        expect(response.statusCode).toBe(403);
    });

    it("authorize allows admin users", async () => {
        const app = await buildTestApp();
        instances.add(app);

        const accessToken = await app.jwt.sign({
            sub: "2",
            login: "admin@example.com",
            role: Role.ADMIN
        } satisfies JwtPayload);

        const response = await app.inject({
            method: "GET",
            url: "/admin-only",
            headers: {
                authorization: `Bearer ${accessToken}`
            }
        });

        expect(response.statusCode).toBe(200);
        expect(getResponseJson<{ status: string }>(response.payload)).toEqual({ status: "ok" });
    });
});
