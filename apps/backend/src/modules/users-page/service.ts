import { Role } from "@/generated/prisma/client.js";
import { assertNotLastOfRole } from "@/shared/lib/assert-last-role/index.js";
import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";
import { handlePrismaError } from "@/shared/lib/prisma-error-handler/index.js";
import { hashPassword } from "@/shared/lib/hash-password/index.js";
import { buildOrderBy, paginationArgs } from "@/shared/lib/prisma-pagination/index.js";
import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";

import type {
    createUserSchema,
    deleteUserSchema,
    getUsersSchema,
    updateUserSchema,
    UserResponse,
} from "./schema.js";

const USER_SORT_FIELDS = new Set(["login", "role", "createdAt"]);

export const getUsersService = async (
    request: FastifyRequestTypeBox<typeof getUsersSchema>
): Promise<{ users: UserResponse[]; total: number; page: number; perPage: number }> => {
    try {
        const { q, page = 1, perPage = 20, sortBy, sortOrder = "asc" } = request.query;

        const where = { deletedAt: null, ...(q ? { login: { contains: q } } : {}) };
        const orderBy = buildOrderBy(USER_SORT_FIELDS, sortBy, sortOrder, { id: "asc" });
        const { skip, take } = paginationArgs(page, perPage);

        const [users, total] = await request.server.prisma.$transaction([
            request.server.prisma.user.findMany({
                where,
                orderBy,
                skip,
                take,
                select: { id: true, login: true, role: true, createdAt: true },
            }),
            request.server.prisma.user.count({ where }),
        ]);

        return {
            users: users.map(u => ({
                id: u.id,
                login: u.login,
                role: u.role as Role,
                createdAt: u.createdAt.toISOString(),
            })),
            total,
            page,
            perPage,
        };
    } catch (error) {
        throw handlePrismaError(error);
    }
};

export const createUserService = async (
    request: FastifyRequestTypeBox<typeof createUserSchema>
): Promise<UserResponse> => {
    try {
        const { login, password, role } = request.body;

        const existing = await request.server.prisma.user.findUnique({
            where: { login },
            select: { id: true },
        });
        if (existing) {
            throw new AppError(HTTP_STATUS.CONFLICT, "Login already taken", "USER_LOGIN_EXISTS");
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
    } catch (error) {
        throw handlePrismaError(error);
    }
};

export const updateUserService = async (
    request: FastifyRequestTypeBox<typeof updateUserSchema>
): Promise<UserResponse> => {
    try {
        const { id } = request.params;
        const { login, password, role } = request.body;

        const user = await request.server.prisma.user.findUnique({
            where: { id },
            select: { id: true, login: true, role: true },
        });
        if (!user) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, "User not found", "USER_NOT_FOUND");
        }

        const data: Record<string, unknown> = {};

        if (login !== undefined) {
            if (login !== user.login) {
                const existing = await request.server.prisma.user.findUnique({
                    where: { login },
                    select: { id: true },
                });
                if (existing) {
                    throw new AppError(HTTP_STATUS.CONFLICT, "Login already taken", "USER_LOGIN_EXISTS");
                }
            }
            data.login = login;
        }

        if (password !== undefined) {
            data.hashPassword = await hashPassword(password, request.server.config.SALT_SECRET);
        }

        if (role !== undefined) {
            if (user.role === Role.ADMIN && role !== Role.ADMIN) {
                await assertNotLastOfRole(
                    request.server.prisma.user,
                    { role: Role.ADMIN },
                    "LAST_ADMIN",
                    { deletedAt: null },
                );
            }
            data.role = role;
        }

        if (Object.keys(data).length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, "No fields to update", "NO_FIELDS_TO_UPDATE");
        }

        const updated = await request.server.prisma.user.update({
            where: { id },
            data,
            select: { id: true, login: true, role: true, createdAt: true },
        });

        return {
            id: updated.id,
            login: updated.login,
            role: updated.role as Role,
            createdAt: updated.createdAt.toISOString(),
        };
    } catch (error) {
        throw handlePrismaError(error);
    }
};

export const deleteUserService = async (
    request: FastifyRequestTypeBox<typeof deleteUserSchema>
): Promise<null> => {
    try {
        const { id } = request.params;

        const user = await request.server.prisma.user.findUnique({
            where: { id },
            select: { id: true, role: true },
        });
        if (!user) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, "User not found", "USER_NOT_FOUND");
        }

        if (String(user.id) === request.user.sub) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, "Cannot delete yourself", "SELF_DELETE");
        }

        if (user.role === Role.ADMIN) {
            await assertNotLastOfRole(
                request.server.prisma.user,
                { role: Role.ADMIN },
                "LAST_ADMIN",
                { deletedAt: null },
            );
        }

        await request.server.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return null;
    } catch (error) {
        throw handlePrismaError(error);
    }
};
