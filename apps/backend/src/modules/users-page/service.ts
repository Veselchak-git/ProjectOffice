import { Role } from "@/generated/prisma/client.js";
import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";
import { hashPassword } from "@/shared/lib/hash-password/index.js";
import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";

import type {
    createUserSchema,
    deleteUserSchema,
    getUsersSchema,
    updateUserRoleSchema,
    UserResponse,
} from "./schema.js";

export const getUsersService = async (
    request: FastifyRequestTypeBox<typeof getUsersSchema>
): Promise<UserResponse[]> => {
    const users = await request.server.prisma.user.findMany({
        select: { id: true, login: true, role: true, createdAt: true },
        orderBy: { id: "asc" },
    });

    return users.map(u => ({
        id: u.id,
        login: u.login,
        role: u.role as Role,
        createdAt: u.createdAt.toISOString(),
    }));
};

export const createUserService = async (
    request: FastifyRequestTypeBox<typeof createUserSchema>
): Promise<UserResponse> => {
    const { login, password, role } = request.body;

    const existing = await request.server.prisma.user.findUnique({
        where: { login },
        select: { id: true },
    });
    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, "Пользователь с таким логином уже существует", "USER_LOGIN_EXISTS");
    }

    const hash = await hashPassword(password, request.server.config.SALT_SECRET);

    const user = await request.server.prisma.user.create({
        data: { login, hashPassword: hash, role },
        select: { id: true, login: true, role: true, createdAt: true },
    });

    return {
        id: user.id,
        login: user.login,
        role: user.role as Role,
        createdAt: user.createdAt.toISOString(),
    };
};

export const updateUserRoleService = async (
    request: FastifyRequestTypeBox<typeof updateUserRoleSchema>
): Promise<UserResponse> => {
    const { id } = request.params;
    const { role } = request.body;

    const user = await request.server.prisma.user.findUnique({
        where: { id },
        select: { id: true, login: true, role: true },
    });
    if (!user) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, "Пользователь не найден", "USER_NOT_FOUND");
    }

    if (user.role === Role.ADMIN && role !== Role.ADMIN) {
        const adminCount = await request.server.prisma.user.count({
            where: { role: Role.ADMIN },
        });
        if (adminCount <= 1) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, "Нельзя понизить единственного администратора", "LAST_ADMIN");
        }
    }

    const updated = await request.server.prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, login: true, role: true, createdAt: true },
    });

    return {
        id: updated.id,
        login: updated.login,
        role: updated.role as Role,
        createdAt: updated.createdAt.toISOString(),
    };
};

export const deleteUserService = async (
    request: FastifyRequestTypeBox<typeof deleteUserSchema>
): Promise<null> => {
    const { id } = request.params;

    const user = await request.server.prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true },
    });
    if (!user) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, "Пользователь не найден", "USER_NOT_FOUND");
    }

    if (String(user.id) === request.user.sub) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Нельзя удалить себя", "SELF_DELETE");
    }

    if (user.role === Role.ADMIN) {
        const adminCount = await request.server.prisma.user.count({
            where: { role: Role.ADMIN },
        });
        if (adminCount <= 1) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, "Нельзя удалить единственного администратора", "LAST_ADMIN");
        }
    }

    await request.server.prisma.user.delete({ where: { id } });

    return null;
};
