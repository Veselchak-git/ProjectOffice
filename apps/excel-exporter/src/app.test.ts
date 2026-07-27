/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { describe, it, expect, afterAll } from "vitest";

import { app } from "./app.js";

describe("app", () => {
    let instance: Awaited<ReturnType<typeof app>>;

    afterAll(async () => {
        await instance?.close();
    });

    it("should create a Fastify instance", async () => {
        instance = await app();
        expect(instance).toBeDefined();
    });

    it("should load env config with defaults", async () => {
        instance = await app();
        expect(instance.config).toBeDefined();
        expect(instance.config.PORT).toBe(3003);
        expect(instance.config.HOST).toBe("0.0.0.0");
        expect(instance.config.NODE_ENV).toBe("test");
        expect(instance.config.BACKEND_URL).toBe("http://localhost:8442");
    });

    it("should register CORS plugin", async () => {
        instance = await app();
        const plugins = instance.printPlugins();
        expect(plugins).toContain("@fastify/cors");
    });

    it("should register export routes", async () => {
        instance = await app();
        const routes = instance.printRoutes();
        expect(routes).toContain("projects (POST)");
        expect(routes).toContain("issues (POST)");
        expect(routes).toContain("users (POST)");
        expect(routes).toContain("audit-log (POST)");
    });
});
