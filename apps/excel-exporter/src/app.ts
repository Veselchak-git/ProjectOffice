/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import fastifyCors from "@fastify/cors";
import Fastify from "fastify";

import { envPlugin } from "./plugins/env-plugin/index.js";
import { exportPlugin } from "./modules/export/index.js";

export const app = async () => {
    const fastify = Fastify({
        logger: {
            transport: {
                target: "pino-pretty",
                options: {
                    translateTime: "HH:MM:ss Z",
                    ignore: "pid, hostname"
                }
            }
        }
    });

    await fastify.register(envPlugin);
    await fastify.register(fastifyCors, {
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        preflight: true,
        optionsSuccessStatus: 204
    });
    await fastify.register(exportPlugin);

    fastify.log.info("routes: %o", fastify.printRoutes());
    fastify.log.info("Plugins: %o", fastify.printPlugins());

    return fastify;
};
