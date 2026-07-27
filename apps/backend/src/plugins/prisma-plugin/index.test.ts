/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import fp from "fastify-plugin";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ENV_PLUGIN } from "@/plugins/env-plugin/index.js";
import { defaultBuildTestApp } from "@/shared/lib/testing/defaultBuildTestApp.test-helper.js";

import { PRISMA_DECORATOR, prismaPlugin } from "./index.js";

// --- Mocks ---

const mockDisconnect = vi.fn().mockResolvedValue(undefined);
const mockConnect = vi.fn().mockResolvedValue(undefined);

vi.mock("@/generated/prisma/client.js", () => {
    return {
        PrismaClient: class {
            $connect = mockConnect;
            $disconnect = mockDisconnect;
        },
    };
});

vi.mock("@prisma/adapter-pg", () => {
    return {
        PrismaPg: vi.fn(function () {
            // plain constructor — nothing to initialize in tests
        }),
    };
});

// --- Helpers ---

const envPluginStub = fp(async () => {}, { name: ENV_PLUGIN });

const buildTestApp = async () => {
    const fastify = defaultBuildTestApp();

    await fastify.register(envPluginStub);
    await fastify.register(prismaPlugin);

    return fastify;
};

// --- Tests ---

describe("prismaPlugin", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(async () => {
        vi.restoreAllMocks();
    });

    it("decorates fastify with prisma instance", async () => {
        const app = await buildTestApp();

        try {
            expect(app[PRISMA_DECORATOR]).toBeDefined();
            expect(mockConnect).toHaveBeenCalledTimes(1);
        } finally {
            await app.close();
        }
    });

    it("calls $connect on plugin registration", async () => {
        const app = await buildTestApp();

        try {
            expect(mockConnect).toHaveBeenCalledTimes(1);
        } finally {
            await app.close();
        }
    });

    it("calls $disconnect on close", async () => {
        const app = await buildTestApp();

        await app.close();

        expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it("creates PrismaPg adapter with DATABASE_URL from config", async () => {
        const { PrismaPg } = await import("@prisma/adapter-pg");

        const app = await buildTestApp();

        try {
            expect(PrismaPg).toHaveBeenCalledWith({
                connectionString: expect.stringContaining("postgresql://"),
            });
        } finally {
            await app.close();
        }
    });
});
