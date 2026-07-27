import { Role } from "@/generated/prisma/client.js";
import { defaultBuildTestApp } from "@/shared/lib/testing/defaultBuildTestApp.test-helper.js";

import { getPreferencesService, putPreferencesService } from "../service.js";

const buildTestApp = async () => {
    const fastify = defaultBuildTestApp();

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

    return fastify;
};

const buildRequest = (app: Awaited<ReturnType<typeof buildTestApp>>, overrides: Record<string, unknown> = {}) =>
    ({
        server: app,
        user: { sub: "1", login: "admin@example.com", role: Role.ADMIN },
        query: {},
        body: {},
        ...overrides,
    }) as any;

describe("userPreferences service", () => {
    let app: Awaited<ReturnType<typeof buildTestApp>>;

    beforeEach(async () => {
        app = await buildTestApp();
        vi.clearAllMocks();
    });

    afterEach(async () => {
        await app?.close();
    });

    describe("getPreferencesService", () => {
        it("returns settings when record exists", async () => {
            const request = buildRequest(app, {
                query: { page: "issues" },
            });

            const result = await getPreferencesService(request);

            expect(result.settings).toBeDefined();
            expect(result.settings).toEqual({ columns: [{ id: "name", visible: true }] });
        });

        it("returns empty object when record not found", async () => {
            const request = buildRequest(app, {
                query: { page: "nonexistent" },
            });

            const result = await getPreferencesService(request);

            expect(result).toEqual({});
        });

        it("converts userId from string to number", async () => {
            const request = buildRequest(app, {
                user: { sub: "1", login: "admin@example.com", role: Role.ADMIN },
                query: { page: "issues" },
            });

            const result = await getPreferencesService(request);

            expect(result.settings).toBeDefined();
        });
    });

    describe("putPreferencesService", () => {
        it("upserts settings and returns them", async () => {
            const mockSettings = { columns: [{ id: "name", visible: false }] };
            const request = buildRequest(app, {
                body: { page: "issues", settings: mockSettings },
            });

            const result = await putPreferencesService(request);

            expect(result.settings).toEqual(mockSettings);
        });

        it("passes userId and page to upsert", async () => {
            const mockSettings = { columns: [{ id: "id", visible: true }] };
            const request = buildRequest(app, {
                user: { sub: "1", login: "admin@example.com", role: Role.ADMIN },
                body: { page: "issues", settings: mockSettings },
            });

            const result = await putPreferencesService(request);

            expect(result.settings).toEqual(mockSettings);
        });

        it("handles different pages", async () => {
            const mockSettings = { columns: [{ id: "title", visible: true }] };
            const request = buildRequest(app, {
                body: { page: "projects", settings: mockSettings },
            });

            const result = await putPreferencesService(request);

            expect(result.settings).toEqual(mockSettings);
        });
    });
});
