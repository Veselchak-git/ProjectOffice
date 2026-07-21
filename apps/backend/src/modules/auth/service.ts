import ms from "ms";

import type { Role } from "@/generated/prisma/enums.js";

import type { UserRepository } from "@/modules/users/repository.js";

import type { JwtPayload } from "@/plugins/jwt-plugin/model.js";

import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";
import { hashPassword, verifyPassword } from "@/shared/lib/hash-password/index.js";
import { generateRefreshToken, hashRefreshToken } from "@/shared/lib/refresh-token/index.js";
import type { FastifyReplyTypeBox, FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";

import type {
    changePasswordSchema,
    getCurrentUserSchema,
    logoutSchema,
    postLoginSchema,
    refreshSchema,
    AuthUser,
    CurrentUserResponse,
    LoginResponse,
    RefreshResponse,
    LogoutResponse
} from "./schema.js";

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

const REFRESH_COOKIE = "refreshToken";

function setRefreshCookie(
    reply: FastifyReplyTypeBox<typeof postLoginSchema | typeof refreshSchema | typeof logoutSchema>,
    token: string,
    ttlMs: number
): void {
    reply.setCookie(REFRESH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth",
        maxAge: Math.floor(ttlMs / 1000)
    });
}

function clearRefreshCookie(
    reply: FastifyReplyTypeBox<typeof postLoginSchema | typeof refreshSchema | typeof logoutSchema>
): void {
    reply.setCookie(REFRESH_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth",
        maxAge: 0
    });
}

export const loginService = async (
    request: FastifyRequestTypeBox<typeof postLoginSchema>,
    reply: FastifyReplyTypeBox<typeof postLoginSchema>
): Promise<LoginResponse> => {
    const login = normalizeLogin(request.body.login);
    const userRecord = await request.server.userRepository.findUserRecordByLogin(login);

    if (!userRecord) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, "Invalid credentials", "AUTH_INVALID_CREDENTIALS");
    }

    const isPasswordValid = await verifyPassword(
        request.body.password,
        userRecord.hashPassword,
        request.server.config.SALT_SECRET
    );

    if (!isPasswordValid) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, "Invalid credentials", "AUTH_INVALID_CREDENTIALS");
    }

    const user = toAuthUser(userRecord);

    const accessToken = await request.server.jwt.sign(createJwtPayload(user), {
        expiresIn: request.server.config.JWT_ACCESS_TTL
    });

    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const ttlMs = ms(request.server.config.REFRESH_TOKEN_TTL as ms.StringValue);
    await request.server.userRepository.deleteAllUserRefreshTokens(userRecord.id);
    await request.server.userRepository.createRefreshToken(userRecord.id, tokenHash, new Date(Date.now() + ttlMs));

    setRefreshCookie(reply, rawRefreshToken, ttlMs);

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

export const refreshService = async (
    request: FastifyRequestTypeBox<typeof refreshSchema>,
    reply: FastifyReplyTypeBox<typeof refreshSchema>
): Promise<RefreshResponse> => {
    const rawRefreshToken = request.cookies[REFRESH_COOKIE];
    if (!rawRefreshToken) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, "No refresh token provided", "AUTH_NO_REFRESH_TOKEN");
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const storedToken = await request.server.userRepository.findRefreshToken(tokenHash);

    if (!storedToken) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, "Invalid refresh token", "AUTH_INVALID_REFRESH_TOKEN");
    }

    if (storedToken.expiresAt < new Date()) {
        await request.server.userRepository.deleteRefreshToken(storedToken.id);
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, "Refresh token expired", "AUTH_REFRESH_TOKEN_EXPIRED");
    }

    await request.server.userRepository.deleteRefreshToken(storedToken.id);
    const newRawRefreshToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRawRefreshToken);
    const ttlMs = ms(request.server.config.REFRESH_TOKEN_TTL as ms.StringValue);
    await request.server.userRepository.createRefreshToken(
        storedToken.userId,
        newTokenHash,
        new Date(Date.now() + ttlMs)
    );

    setRefreshCookie(reply, newRawRefreshToken, ttlMs);

    const userRecord = await request.server.userRepository.findUserById(storedToken.userId);
    if (!userRecord) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, "User not found", "AUTH_USER_NOT_FOUND");
    }

    const user = toAuthUser(userRecord);
    const accessToken = await request.server.jwt.sign(createJwtPayload(user), {
        expiresIn: request.server.config.JWT_ACCESS_TTL
    });

    return {
        accessToken,
        expiresIn: request.server.config.JWT_ACCESS_TTL
    };
};

export const logoutService = async (
    request: FastifyRequestTypeBox<typeof logoutSchema>,
    reply: FastifyReplyTypeBox<typeof logoutSchema>
): Promise<LogoutResponse> => {
    const rawRefreshToken = request.cookies[REFRESH_COOKIE];
    if (rawRefreshToken) {
        const tokenHash = hashRefreshToken(rawRefreshToken);
        const storedToken = await request.server.userRepository.findRefreshToken(tokenHash);
        if (storedToken) {
            await request.server.userRepository.deleteRefreshToken(storedToken.id);
        }
    }

    clearRefreshCookie(reply);

    return { message: "Logged out successfully" };
};

export const changePasswordService = async (
    request: FastifyRequestTypeBox<typeof changePasswordSchema>
): Promise<{ message: string }> => {
    const userId = Number(request.user.sub);
    const { currentPassword, newPassword } = request.body;

    const userRecord = await request.server.userRepository.findUserRecordByLogin(request.user.login);

    if (!userRecord) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "User not found", "USER_NOT_FOUND");
    }

    const isPasswordValid = await verifyPassword(
        currentPassword,
        userRecord.hashPassword,
        request.server.config.SALT_SECRET
    );

    if (!isPasswordValid) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, "Current password is incorrect", "INVALID_CURRENT_PASSWORD");
    }

    const newHash = await hashPassword(newPassword, request.server.config.SALT_SECRET);
    await request.server.userRepository.updateUserPassword(userId, newHash);

    return { message: "Password changed successfully" };
};
