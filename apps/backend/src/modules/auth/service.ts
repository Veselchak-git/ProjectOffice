/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { Role } from "@/generated/prisma/enums.js";

import type { UserRepository } from "@/modules/users/repository.js";

import type { JwtPayload } from "@/plugins/jwt-plugin/model.js";

import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";
import { verifyPassword } from "@/shared/lib/hash-password/index.js";
import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";

import type { AuthUser, CurrentUserResponse, LoginResponse, getCurrentUserSchema, postLoginSchema } from "./schema.js";

const normalizeLogin = (login: string) => login.trim().toLowerCase();

type AuthUserRecord = NonNullable<Awaited<ReturnType<UserRepository["findUserRecordByLogin"]>>>;

const toAuthUser = (user: AuthUserRecord): AuthUser => ({
    id: String(user.id),
    login: user.login,
    role: user.role as unknown as Role
});

const createJwtPayload = (user: AuthUser): JwtPayload => ({
    sub: user.id,
    login: user.login,
    role: user.role
});

export const loginService = async (request: FastifyRequestTypeBox<typeof postLoginSchema>): Promise<LoginResponse> => {
    const login = normalizeLogin(request.body.login);
    const userRecord = await request.server.userRepository.findUserRecordByLogin(login);

    if (!userRecord) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized", "AUTH_INVALID_CREDENTIALS");
    }

    const isPasswordValid = await verifyPassword(
        request.body.password,
        userRecord.hashPassword,
        request.server.config.SALT_SECRET
    );

    if (!isPasswordValid) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized", "AUTH_INVALID_CREDENTIALS");
    }

    const user = toAuthUser(userRecord);

    const accessToken = await request.server.jwt.sign(createJwtPayload(user), {
        expiresIn: request.server.config.JWT_ACCESS_TTL
    });

    return {
        accessToken,
        expiresIn: request.server.config.JWT_ACCESS_TTL,
        user
    };
};

export const getCurrentUserService = async (
    request: FastifyRequestTypeBox<typeof getCurrentUserSchema>
): Promise<CurrentUserResponse> => {
    return {
        user: {
            id: request.user.sub,
            login: request.user.login,
            role: request.user.role
        }
    };
};
