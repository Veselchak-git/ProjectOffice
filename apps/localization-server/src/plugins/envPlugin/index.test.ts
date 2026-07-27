/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import { envPlugin } from "./index.js";

describe("envPlugin", () => {
    it("registers config decorator", async () => {
        const fastify = Fastify();
        await fastify.register(envPlugin);
        await fastify.ready();
        expect(fastify.config).toBeDefined();
        await fastify.close();
    });
});
