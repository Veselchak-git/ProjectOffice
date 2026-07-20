/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Role } from "@/generated/prisma/client.js";
import type { RefreshToken } from "@/generated/prisma/client.js";

import type { IUserRepository } from "@/modules/users/repository.js";

import { generateRefreshToken, hashRefreshToken } from "@/shared/lib/refresh-token/index.js";

import { cookiePlugin } from "@/plugins/cookie-plugin/index.js";
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

    await fastify.register(cookiePlugin);
    await fastify.register(jwtPlugin);

    const mockStore: { tokenHash: string; userId: number; expiresAt: Date }[] = [];

    const mockUserRepository = {
        findUserRecordByLogin: async (login: string) => {
            const records = [
                {
                    id: 1,
                    login: "student@example.com",
                    role: Role.USER,
                    hashPassword: await hashPassword("student123", "test-salt-secret"),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null
                },
                {
                    id: 2,
                    login: "admin@example.com",
                    role: Role.ADMIN,
                    hashPassword: await hashPassword("admin123", "test-salt-secret"),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null
                }
            ];

            return records.find(user => user.login === login) ?? null;
        },
        findUserById: async (id: number) => {
            const records = [
                {
                    id: 1,
                    login: "student@example.com",
                    role: Role.USER,
                    hashPassword: await hashPassword("student123", "test-salt-secret"),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null
                },
                {
                    id: 2,
                    login: "admin@example.com",
                    role: Role.ADMIN,
                    hashPassword: await hashPassword("admin123", "test-salt-secret"),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null
                }
            ];

            return records.find(user => user.id === id) ?? null;
        },
        updateUserPassword: async (id: number, newHashPassword: string) => {
            return {
                id,
                login: "student@example.com",
                role: Role.USER,
                hashPassword: newHashPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
            };
        },
        createRefreshToken: async (userId: number, tokenHash: string, expiresAt: Date) => {
            const token = { id: mockStore.length + 1, userId, tokenHash, expiresAt, createdAt: new Date() } as RefreshToken;
            mockStore.push({ tokenHash, userId, expiresAt });
            return token;
        },
        findRefreshToken: async (tokenHash: string) => {
            const found = mockStore.find(t => t.tokenHash === tokenHash);
            return found ? { id: mockStore.indexOf(found) + 1, ...found, createdAt: new Date() } as RefreshToken : null;
        },
        deleteRefreshToken: async (id: number) => {
            const idx = id - 1;
            if (idx >= 0 && idx < mockStore.length) {
                mockStore.splice(idx, 1);
            }
        },
        deleteAllUserRefreshTokens: async (userId: number) => {
            const remaining = mockStore.filter(t => t.userId !== userId);
            mockStore.length = 0;
            mockStore.push(...remaining);
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
            role: "USER"
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
                role: Role.USER
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

    describe("POST /api/auth/refresh", () => {
        it("returns new access token for valid refresh cookie", async () => {
            const loginResponse = await app.inject({
                method: "POST",
                url: "/api/auth/login",
                payload: {
                    login: "student@example.com",
                    password: "student123"
                }
            });

            expect(loginResponse.statusCode).toBe(200);

            const refreshCookie = loginResponse.cookies?.[0];
            expect(refreshCookie).toBeDefined();
            expect(refreshCookie!.name).toBe("refreshToken");

            const response = await app.inject({
                method: "POST",
                url: "/api/auth/refresh",
                cookies: { refreshToken: refreshCookie!.value }
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ accessToken: string; expiresIn: string }>(response.payload);
            expect(body.accessToken).toBeTruthy();
            expect(body.expiresIn).toBe("15m");
        });

        it("returns 401 without refresh cookie", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/api/auth/refresh"
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 401 for invalid refresh token", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/api/auth/refresh",
                cookies: { refreshToken: "00000000-0000-0000-0000-000000000000" }
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 401 for expired refresh token", async () => {
            const rawToken = generateRefreshToken();
            const tokenHash = hashRefreshToken(rawToken);
            await app.userRepository.createRefreshToken(1, tokenHash, new Date(Date.now() - 10000));

            const response = await app.inject({
                method: "POST",
                url: "/api/auth/refresh",
                cookies: { refreshToken: rawToken }
            });

            expect(response.statusCode).toBe(401);
        });
    });

    describe("POST /api/auth/logout", () => {
        it("logs out successfully with valid refresh cookie", async () => {
            const loginResponse = await app.inject({
                method: "POST",
                url: "/api/auth/login",
                payload: {
                    login: "student@example.com",
                    password: "student123"
                }
            });

            expect(loginResponse.statusCode).toBe(200);

            const refreshCookie = loginResponse.cookies?.[0];
            expect(refreshCookie).toBeDefined();

            const response = await app.inject({
                method: "POST",
                url: "/api/auth/logout",
                cookies: { refreshToken: refreshCookie!.value }
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ message: string }>(response.payload);
            expect(body.message).toBe("Logged out successfully");
        });

        it("succeeds even without refresh cookie", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/api/auth/logout"
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ message: string }>(response.payload);
            expect(body.message).toBe("Logged out successfully");
        });
    });
});
