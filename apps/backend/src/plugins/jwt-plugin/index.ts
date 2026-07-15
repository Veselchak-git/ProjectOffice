/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { Role } from "@/generated/prisma/client.js";
import fastifyJwt from "@fastify/jwt";
import type { FastifyPluginAsync, preHandlerHookHandler } from "fastify";
import fp from "fastify-plugin";

import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";

import { ENV_DECORATOR_NAME } from "../env-plugin/index.js";
import type { JwtPayload } from "./model.js";

const JWT_PLUGIN_NAME = "jwtPlugin";
export const JWT_DECORATOR_AUTHENTICATE = "authenticate";
export const JWT_DECORATOR_AUTHORIZE = "authorize";

const plugin: FastifyPluginAsync = async fastify => {
    await fastify.register(fastifyJwt, {
        secret: fastify.config.JWT_ACCESS_SECRET
    });
    const authenticate: preHandlerHookHandler = async request => {
        await request.jwtVerify();
    };

    const authorize = ((...roles: Role[]) => {
        const guard: preHandlerHookHandler = async request => {
            await request.jwtVerify();

            if (!roles.includes(request.user.role)) {
                throw new AppError(HTTP_STATUS.FORBIDDEN, "Forbidden", "AUTH_FORBIDDEN");
            }
        };

        return guard;
    }) as FastifyAuthorize;

    fastify.decorate(JWT_DECORATOR_AUTHENTICATE, authenticate);
    fastify.decorate(JWT_DECORATOR_AUTHORIZE, authorize);
};
// вот тут плагин зависит от envPlugin, т.к. он использует secret из envPlugin
// и если envPlugin не будет зарегистрирован, то будет ошибка при попытке использовать jwtPlugin
export const jwtPlugin = fp(plugin, { name: JWT_PLUGIN_NAME, decorators: { fastify: [ENV_DECORATOR_NAME] } });

type FastifyAuthorize = (...roles: Role[]) => preHandlerHookHandler;

declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: JwtPayload;
        user: JwtPayload;
    }
}
declare module "fastify" {
    interface FastifyInstance {
        [JWT_DECORATOR_AUTHENTICATE]: preHandlerHookHandler;
        [JWT_DECORATOR_AUTHORIZE]: FastifyAuthorize;
    }
}
