/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { PrismaClient, User } from "@/generated/prisma/client.js";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { PRISMA_DECORATOR_NAME, PRISMA_PLUGIN_NAME } from "@/plugins/prisma-plugin/index.js";

export const USER_REPOSITORY_PLUGIN_NAME = "userRepositoryPlugin";
export const USER_REPOSITORY_DECORATOR_NAME = "userRepository";

// объявляем интерфейс для репозитория пользователей - нужно для переиспользования в других модулях и тестах
export interface IUserRepository {
    findUserRecordByLogin(login: string): Promise<User | null>;
}
// имплементируем интерфейс для репозитория пользователей
export class UserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findUserRecordByLogin(login: string) {
        return this.prisma.user.findUnique({
            where: { login }
        });
    }
}
// репозиторий это фактически плагин с декоратором, который инкапсулирует логику работы с пользователями
// вместо прямого общения с призмой
const plugin: FastifyPluginAsync = async fastify => {
    fastify.decorate(USER_REPOSITORY_DECORATOR_NAME, new UserRepository(fastify.prisma));
};

export const userRepositoryPlugin = fp(plugin, {
    name: USER_REPOSITORY_PLUGIN_NAME,
    decorators: {
        fastify: [PRISMA_DECORATOR_NAME]
    },
    dependencies: [PRISMA_PLUGIN_NAME]
});

//декларируем тоже в глобальном модуле fastify чтобы типы были доступны везде,
// но нужно понимать, что в этом месте проверка типов может наврать -
// декоратора или плагина может не быть в скоупе, если он подключается НЕ глобально,
// чтобы избежать ошибок нужно использовать dependencies и decorators в fastify-plugin
declare module "fastify" {
    interface FastifyInstance {
        [USER_REPOSITORY_DECORATOR_NAME]: IUserRepository;
    }
}
