/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { PrismaClient, RefreshToken, User } from "@/generated/prisma/client.js";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { PRISMA_DECORATOR_NAME, PRISMA_PLUGIN_NAME } from "@/plugins/prisma-plugin/index.js";

export const USER_REPOSITORY_PLUGIN_NAME = "userRepositoryPlugin";
export const USER_REPOSITORY_DECORATOR_NAME = "userRepository";

// объявляем интерфейс для репозитория пользователей - нужно для переиспользования в других модулях и тестах
export interface IUserRepository {
    findUserRecordByLogin(login: string): Promise<User | null>;
    findUserById(id: number): Promise<User | null>;
    updateUserPassword(id: number, newHashPassword: string): Promise<User>;
    createRefreshToken(userId: number, tokenHash: string, expiresAt: Date): Promise<RefreshToken>;
    findRefreshToken(tokenHash: string): Promise<RefreshToken | null>;
    deleteRefreshToken(id: number): Promise<void>;
    deleteAllUserRefreshTokens(userId: number): Promise<void>;
}
// имплементируем интерфейс для репозитория пользователей
export class UserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findUserRecordByLogin(login: string) {
        return this.prisma.user.findUnique({
            where: { login }
        });
    }

    async findUserById(id: number) {
        return this.prisma.user.findUnique({
            where: { id }
        });
    }

    async updateUserPassword(id: number, newHashPassword: string) {
        return this.prisma.user.update({
            where: { id },
            data: { hashPassword: newHashPassword }
        });
    }

    async createRefreshToken(userId: number, tokenHash: string, expiresAt: Date) {
        return this.prisma.refreshToken.create({
            data: { userId, tokenHash, expiresAt }
        });
    }

    async findRefreshToken(tokenHash: string) {
        return this.prisma.refreshToken.findFirst({
            where: { tokenHash }
        });
    }

    async deleteRefreshToken(id: number) {
        await this.prisma.refreshToken.delete({ where: { id } });
    }

    async deleteAllUserRefreshTokens(userId: number) {
        await this.prisma.refreshToken.deleteMany({ where: { userId } });
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
