/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { describe, it, expect } from "vitest";
import Fastify from "fastify";

import { envPlugin, ENV_DECORATOR } from "./index.js";

describe("envPlugin", () => {
    it("should register and load env config", async () => {
        const fastify = Fastify();
        await fastify.register(envPlugin);
        await fastify.ready();

        expect(fastify.config).toBeDefined();

        await fastify.close();
    });

    it("should populate config with default values", async () => {
        const fastify = Fastify();
        await fastify.register(envPlugin);
        await fastify.ready();

        expect(fastify.config.PORT).toBe(3003);
        expect(fastify.config.HOST).toBe("0.0.0.0");
        expect(fastify.config.NODE_ENV).toBe("test");
        expect(fastify.config.BACKEND_URL).toBe("http://localhost:8442");

        await fastify.close();
    });

    it("should use ENV_DECORATOR constant as config key", () => {
        expect(ENV_DECORATOR).toBe("config");
    });
});
