/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Role } from "@/generated/prisma/client.js";

import type { IUserRepository } from "@/modules/users/repository.js";

import { jwtPlugin } from "@/plugins/jwt-plugin/index.js";
import type { JwtPayload } from "@/plugins/jwt-plugin/model.js";

import { hashPassword } from "@/shared/lib/hash-password/index.js";
import { defaultBuildTestApp } from "@/shared/lib/testing/defaultBuildTestApp.test-helper.js";

import { authControllerPlugin } from "../controller.js";

const buildTestApp = async (jwtAccessTtl = "15m") => {
    const fastify = defaultBuildTestApp({
        config: {
            JWT_ACCESS_TTL: jwtAccessTtl
        }
    });

    await fastify.register(jwtPlugin);

    const mockUserRepository = {
        findUserRecordByLogin: async (login: string) => {
            const records = [
                {
                    id: 1,
                    login: "student@example.com",
                    role: Role.GUEST,
                    hashPassword: await hashPassword("student123", "test-salt-secret"),
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 2,
                    login: "admin@example.com",
                    role: Role.ADMIN,
                    hashPassword: await hashPassword("admin123", "test-salt-secret"),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            return records.find(user => user.login === login) ?? null;
        }
    } satisfies IUserRepository;

    fastify.decorate("userRepository", mockUserRepository);
    await fastify.register(
        async scopedFastify => {
            await scopedFastify.register(authControllerPlugin);
        },
        { prefix: "/api" }
    );

    return fastify;
};

const getResponseJson = <T>(payload: string): T => JSON.parse(payload) as T;

describe("authController", () => {
    let app: Awaited<ReturnType<typeof buildTestApp>>;

    beforeEach(async () => {
        app = await buildTestApp();
    });

    afterEach(async () => {
        await app?.close();
    });

    it("returns accessToken for valid credentials", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/auth/login",
            payload: {
                login: "student@example.com",
                password: "student123"
            }
        });

        expect(response.statusCode).toBe(200);

        const body = getResponseJson<{
            accessToken: string;
            expiresIn: string;
            user: { login: string };
        }>(response.payload);

        expect(body.accessToken).toBeTruthy();
        expect(body.expiresIn).toBe("15m");
        expect(body.user.login).toBe("student@example.com");
    });

    it("returns 401 for unknown email", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/auth/login",
            payload: {
                login: "missing@example.com",
                password: "student123"
            }
        });

        expect(response.statusCode).toBe(401);
    });

    it("returns 401 for invalid password", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/auth/login",
            payload: {
                login: "student@example.com",
                password: "wrong-password"
            }
        });

        expect(response.statusCode).toBe(401);
    });

    it("returns 400 for invalid login body", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/auth/login",
            payload: {
                login: "",
                password: ""
            }
        });

        expect(response.statusCode).toBe(400);
    });

    it("returns current user for valid bearer token", async () => {
        const loginResponse = await app.inject({
            method: "POST",
            url: "/api/auth/login",
            payload: {
                login: "student@example.com",
                password: "student123"
            }
        });

        const { accessToken } = getResponseJson<{ accessToken: string }>(loginResponse.payload);
        const response = await app.inject({
            method: "GET",
            url: "/api/auth/me",
            headers: {
                authorization: `Bearer ${accessToken}`
            }
        });

        expect(response.statusCode).toBe(200);

        const body = getResponseJson<{ user: { id: string; login: string; role: string } }>(response.payload);
        expect(body.user).toEqual({
            id: "1",
            login: "student@example.com",
            role: "GUEST"
        });
    });

    it("returns 401 without bearer token", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/api/auth/me"
        });

        expect(response.statusCode).toBe(401);
    });

    it("returns 401 for malformed token", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/api/auth/me",
            headers: {
                authorization: "Bearer malformed-token"
            }
        });

        expect(response.statusCode).toBe(401);
    });

    it("returns 401 for expired token", async () => {
        const expiredToken = await app.jwt.sign(
            {
                sub: "user-1",
                login: "student@example.com",
                role: Role.GUEST
            } satisfies JwtPayload,
            { expiresIn: "-1s" }
        );

        const response = await app.inject({
            method: "GET",
            url: "/api/auth/me",
            headers: {
                authorization: `Bearer ${expiredToken}`
            }
        });

        expect(response.statusCode).toBe(401);
    });
});
