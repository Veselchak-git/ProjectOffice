/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE } from "@/plugins/jwt-plugin/index.js";
import { Role } from "@/generated/prisma/enums.js";

import { AUTH_LOGIN_PATH, AUTH_LOGOUT_PATH, AUTH_ME_PATH, AUTH_ME_PASSWORD_PATH, AUTH_REFRESH_PATH } from "@/shared/routes.js";

import { USER_REPOSITORY_DECORATOR_NAME } from "../users/repository.js";
import { changePasswordSchema, getCurrentUserSchema, logoutSchema, postLoginSchema, refreshSchema } from "./schema.js";
import { changePasswordService, getCurrentUserService, loginService, logoutService, refreshService } from "./service.js";

const plugin: FastifyPluginAsyncTypebox = async fastify => {
    fastify.post(
        AUTH_LOGIN_PATH,
        {
            schema: postLoginSchema
        },
        loginService
    );

    fastify.post(
        AUTH_REFRESH_PATH,
        {
            schema: refreshSchema
        },
        refreshService
    );

    fastify.post(
        AUTH_LOGOUT_PATH,
        {
            schema: logoutSchema
        },
        logoutService
    );

    fastify.get(
        AUTH_ME_PATH,
        {
            schema: getCurrentUserSchema,
            preHandler: [fastify.authenticate]
        },
        getCurrentUserService
    );

    fastify.patch(
        AUTH_ME_PASSWORD_PATH,
        {
            schema: changePasswordSchema,
            preHandler: [fastify.authorize(Role.USER, Role.ADMIN)]
        },
        changePasswordService
    );
};

export const authControllerPlugin = fp(plugin, {
    name: "auth-controller",
    //говорим от чего мы зависим, это поможет отследить ошибки на этапе инициализации.
    // Глобальные декораторы и плагины можно не указывать т.к. они регистрируются на самом верхнем уровне и
    // они точно есть, к примеру мы не указываем prismaPlugin и ошибки не будет если он зарегистрирован
    // на самом верхнем уровне, но мы указываем USER_REPOSITORY_DECORATOR_NAME т.к. он нужен для работы с пользователями
    // и если он не будет зарегистрирован, то будет ошибка при попытке использовать userRepository
    decorators: {
        fastify: [JWT_DECORATOR_AUTHENTICATE, JWT_DECORATOR_AUTHORIZE, USER_REPOSITORY_DECORATOR_NAME]
    }
});
