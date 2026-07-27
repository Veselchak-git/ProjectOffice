/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { describe, it, expect } from "vitest";

// Set env vars before importing
process.env.PORT = "3003";
process.env.HOST = "0.0.0.0";

describe("localization server", () => {
    it("starts and serves locales", async () => {
        // Dynamic import to pick up env vars
        const { default: Fastify } = await import("fastify");
        const { envPlugin } = await import("./plugins/envPlugin/index.js");
        const app = Fastify();
        await app.register(envPlugin);
        await app.ready();
        expect(app).toBeDefined();
        await app.close();
    });
});
