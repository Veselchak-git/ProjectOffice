/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { STATUS_CODES } from "node:http";

import { type TypeBoxTypeProvider, TypeBoxValidatorCompiler } from "@fastify/type-provider-typebox";
import Fastify from "fastify";

import { modules } from "@/modules/index.js";

import { schemasPlugin } from "@/schemas/index.js";

import { appPlugins } from "@/plugins/index.js";

import { HTTP_STATUS, isAppError } from "@/shared/lib/errors/index.js";
import { pinoLogger } from "@/shared/lib/logger/pino.js";

import { PREFIX } from "@/shared/routes.js";

const hasStatusCode = (error: unknown): error is { statusCode: number } =>
    typeof error === "object" && error !== null && "statusCode" in error && typeof error.statusCode === "number";

const getErrorMessage = (error: unknown, statusCode: number) =>
    error instanceof Error ? error.message : (STATUS_CODES[statusCode] ?? "Error");

export const app = async () => {
    const fastify = Fastify({
        logger: pinoLogger
    })
        .setValidatorCompiler(TypeBoxValidatorCompiler)
        .withTypeProvider<TypeBoxTypeProvider>();

    //register plugins
    await fastify.register(appPlugins);
    //register schemas
    await fastify.register(schemasPlugin);
    //register modules
    await fastify.register(modules, { prefix: PREFIX });

    fastify.setErrorHandler((error, request, reply) => {
        const statusCode =
            isAppError(error) || hasStatusCode(error) ? error.statusCode : HTTP_STATUS.INTERNAL_SERVER_ERROR;

        request.log.error(error);

        void reply.status(statusCode).send({
            statusCode,
            code: isAppError(error) ? error.code : "INTERNAL_SERVER_ERROR",
            error: STATUS_CODES[statusCode] ?? "Error",
            message: getErrorMessage(error, statusCode)
        });
    });

    fastify.log.info("Schemas: %o", fastify.getSchemas());
    fastify.log.info("routes: %o", fastify.printRoutes());
    fastify.log.info("Plugins: %o", fastify.printPlugins());

    return fastify;
};
