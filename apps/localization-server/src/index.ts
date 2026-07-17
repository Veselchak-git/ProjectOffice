/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { envPlugin } from "./plugins/envPlugin/index.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = Fastify({
    logger: {
        transport: {
            target: "pino-pretty",
            options: {
                translateTime: "HH:MM:ss Z",
                ignore: "pid, hostname",
            },
        },
    },
});

const start = async () => {
    try {
        await app.register(envPlugin);
        await app.register(fastifyCors, {
            origin: "*",
            methods: ["GET", "OPTIONS"],
            allowedHeaders: ["Content-Type"],
            preflight: true,
            optionsSuccessStatus: 204,
        });
        await app.register(fastifyStatic, {
            root: join(__dirname, "public"),
            prefix: "/",
            wildcard: false,
        });
        const PORT = parseInt(process.env.PORT ?? "3001", 10);
        const HOST = process.env.HOST ?? "0.0.0.0";
        const address = await app.listen({ port: PORT, host: HOST });
        app.log.info(`Server is running on ${address}`);
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
};

void start();
