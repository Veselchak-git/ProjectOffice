/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { PrismaClient } from "@/generated/prisma/client.js";
import { Role } from "@/generated/prisma/enums.js";
import type { preHandlerHookHandler } from "fastify";

import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";

export async function checkProjectMember(
    prisma: PrismaClient,
    projectId: number,
    userId: number,
    requiredRoles?: string[],
    allowAdmin = true,
) {
    if (allowAdmin) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        if (user?.role === Role.ADMIN) return;
    }

    const member = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId } },
    });

    if (!member) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Access denied", "AUTH_FORBIDDEN");
    }

    if (requiredRoles && !requiredRoles.includes(member.role)) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Access denied", "AUTH_FORBIDDEN");
    }

    return member;
}

const ROLE_HIERARCHY: Record<string, number> = {
    VIEWER: 0,
    REPORTER: 1,
    UPDATER: 2,
    DEVELOPER: 3,
    MANAGER: 4,
};

export interface CheckProjectAccessOptions {
    requireProjectRoles?: string[];
    allowGlobalAdmin?: boolean;
    checkSelfModification?: boolean;
    checkRoleHierarchy?: boolean;
}

export const createCheckProjectAccess = (options: CheckProjectAccessOptions): preHandlerHookHandler => {
    return async request => {
        const params = request.params as Record<string, unknown>;
        const projectId = Number(params.id);
        const userId = Number(request.user.sub);

        if (options.checkSelfModification) {
            const targetUserId = params.userId != null ? Number(params.userId) : undefined;
            if (targetUserId !== undefined && targetUserId === userId) {
                throw new AppError(HTTP_STATUS.FORBIDDEN, "Cannot change your own role", "SELF_ROLE_CHANGE");
            }
        }

        if (options.allowGlobalAdmin && request.user.role === Role.ADMIN) return;

        const member = await checkProjectMember(request.server.prisma, projectId, userId, undefined, false);
        if (!member) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, "Access denied", "AUTH_FORBIDDEN");
        }

        if (options.checkRoleHierarchy) {
            const targetRole = (request.body as Record<string, unknown> | undefined)?.role as string | undefined;
            if (targetRole) {
                const actorRank = ROLE_HIERARCHY[member.role] ?? 0;
                const targetRank = ROLE_HIERARCHY[targetRole] ?? 0;
                if (targetRank > actorRank) {
                    throw new AppError(HTTP_STATUS.FORBIDDEN, "Insufficient role hierarchy", "ROLE_HIERARCHY");
                }
            }
        }

        if (options.requireProjectRoles && !options.requireProjectRoles.includes(member.role)) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, "Access denied", "AUTH_FORBIDDEN");
        }
    };
};
