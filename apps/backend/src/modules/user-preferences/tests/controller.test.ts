import { Role } from "@/generated/prisma/client.js";

import type { JwtPayload } from "@/plugins/jwt-plugin/model.js";

import { cookiePlugin } from "@/plugins/cookie-plugin/index.js";
import { jwtPlugin } from "@/plugins/jwt-plugin/index.js";

import { defaultBuildTestApp } from "@/shared/lib/testing/defaultBuildTestApp.test-helper.js";

import { userPreferencesControllerPlugin } from "../controller.js";

const buildTestApp = async () => {
    const fastify = defaultBuildTestApp();

    await fastify.register(cookiePlugin);
    await fastify.register(jwtPlugin);

    const mockSettings = { columns: [{ id: "name", visible: true }] };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    const mockPrisma: any = {
        userTableSetting: {
            findUnique: async (args: { where: { userId_page: { userId: number; page: string } } }) => {
                if (args.where.userId_page.userId === 1 && args.where.userId_page.page === "issues") {
                    return { userId: 1, page: "issues", settings: mockSettings };
                }
                return null;
            },
            upsert: async (args: { where: any; update: any; create: any }) => {
                return {
                    userId: args.create.userId,
                    page: args.create.page,
                    settings: args.create.settings,
                };
            },
        },
    };

    fastify.decorate("prisma", mockPrisma);

    await fastify.register(
        async scopedFastify => {
            await scopedFastify.register(userPreferencesControllerPlugin);
        },
        { prefix: "/api" },
    );

    return fastify;
};

const getResponseJson = <T>(payload: string): T => JSON.parse(payload) as T;

describe("userPreferencesController", () => {
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

    describe("GET /users/me/preferences", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/users/me/preferences?page=issues",
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 with settings for ADMIN when record exists", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/users/me/preferences?page=issues",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ settings?: Record<string, unknown> }>(response.payload);

            expect(body.settings).toBeDefined();
            expect(body.settings).toEqual({ columns: [{ id: "name", visible: true }] });
        });

        it("returns 200 with empty body for ADMIN when record not found", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/users/me/preferences?page=nonexistent",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ settings?: Record<string, unknown> }>(response.payload);

            expect(body.settings).toBeUndefined();
        });

        it("returns 200 for USER role", async () => {
            const token = await signUserToken();

            const response = await app.inject({
                method: "GET",
                url: "/api/users/me/preferences?page=issues",
                headers: { authorization: `Bearer ${token}` },
            });

            expect(response.statusCode).toBe(200);
        });
    });

    describe("PUT /users/me/preferences", () => {
        it("returns 401 without auth token", async () => {
            const response = await app.inject({
                method: "PUT",
                url: "/api/users/me/preferences",
                payload: { page: "issues", settings: { columns: [{ id: "name", visible: true }] } },
            });

            expect(response.statusCode).toBe(401);
        });

        it("returns 200 and upserts settings for ADMIN", async () => {
            const token = await signAdminToken();
            const mockSettings = { columns: [{ id: "name", visible: false }] };

            const response = await app.inject({
                method: "PUT",
                url: "/api/users/me/preferences",
                headers: { authorization: `Bearer ${token}` },
                payload: { page: "issues", settings: mockSettings },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ settings: Record<string, unknown> }>(response.payload);

            expect(body.settings).toEqual(mockSettings);
        });

        it("returns 200 for USER role", async () => {
            const token = await signUserToken();
            const mockSettings = { columns: [{ id: "title", visible: true }] };

            const response = await app.inject({
                method: "PUT",
                url: "/api/users/me/preferences",
                headers: { authorization: `Bearer ${token}` },
                payload: { page: "projects", settings: mockSettings },
            });

            expect(response.statusCode).toBe(200);

            const body = getResponseJson<{ settings: Record<string, unknown> }>(response.payload);

            expect(body.settings).toEqual(mockSettings);
        });

        it("returns 400 for invalid body", async () => {
            const token = await signAdminToken();

            const response = await app.inject({
                method: "PUT",
                url: "/api/users/me/preferences",
                headers: { authorization: `Bearer ${token}` },
                payload: { page: "", settings: "invalid" },
            });

            expect(response.statusCode).toBe(400);
        });
    });
});
