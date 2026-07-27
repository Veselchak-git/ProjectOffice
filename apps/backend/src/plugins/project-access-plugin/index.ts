/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { PrismaClient } from "@/generated/prisma/client.js";
import { ProjectMemberRole, Role } from "@/generated/prisma/enums.js";
import type { FastifyPluginAsync, FastifyRequest, preHandlerHookHandler } from "fastify";
import fp from "fastify-plugin";

import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";

// --- Decorator type ---

export interface ProjectAccessInfo {
    globalRole: Role;
    localRole: ProjectMemberRole | null;
}

declare module "fastify" {
    interface FastifyRequest {
        projectAccess: ProjectAccessInfo;
        _projectAccess?: ProjectAccessInfo;
    }
}

// --- Constants ---

const PROJECT_ACCESS_PLUGIN = "projectAccess";
export const PROJECT_ACCESS_DECORATOR = "projectAccess";

const ROLE_HIERARCHY: Record<string, number> = {
    VIEWER: 0,
    REPORTER: 1,
    UPDATER: 2,
    DEVELOPER: 3,
    MANAGER: 4,
};

// --- Plugin ---

const plugin: FastifyPluginAsync = async fastify => {
    fastify.decorateRequest(PROJECT_ACCESS_DECORATOR, {
        getter() {
            return this[`_${PROJECT_ACCESS_DECORATOR}`] ?? { globalRole: "" as Role, localRole: null };
        },
        setter(value: ProjectAccessInfo) {
            this[`_${PROJECT_ACCESS_DECORATOR}`] = value;
        },
    });
};

export const projectAccessPlugin = fp(plugin, {
    name: PROJECT_ACCESS_PLUGIN,
});

// --- Utility: get project IDs where user is MANAGER ---

export async function getManagerProjectIds(prisma: PrismaClient, userId: number): Promise<number[]> {
    const memberships = await prisma.projectMember.findMany({
        where: { userId, role: "MANAGER" },
        select: { projectId: true },
    });
    return memberships.map(m => m.projectId);
}

// --- Service-level: resolve for a known projectId ---

export async function resolveProjectAccess(
    request: FastifyRequest,
    projectId: number,
    options?: { requiredRoles?: ProjectMemberRole[]; allowAdmin?: boolean },
) {
    const userId = Number(request.user.sub);
    const globalRole = request.user.role as Role;

    request.projectAccess = { globalRole, localRole: null };

    const allowAdmin = options?.allowAdmin !== false;
    if (allowAdmin && globalRole === Role.ADMIN) return;

    const member = await request.server.prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId } },
    });

    if (!member) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Access denied", "AUTH_FORBIDDEN");
    }

    if (options?.requiredRoles && !options.requiredRoles.includes(member.role)) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Access denied", "AUTH_FORBIDDEN");
    }

    request.projectAccess.localRole = member.role;
}

// --- PreHandler guard (for routes with :id = projectId) ---

export interface ProjectAccessGuardOptions {
    requiredRoles?: ProjectMemberRole[];
    allowGlobalAdmin?: boolean;
    checkSelfModification?: boolean;
    checkRoleHierarchy?: boolean;
    allowSelfLeave?: boolean;
}

export const createProjectAccessGuard = (options?: ProjectAccessGuardOptions): preHandlerHookHandler => {
    return async request => {
        const params = request.params as Record<string, unknown>;
        const projectId = Number(params.id);
        const userId = Number(request.user.sub);
        const globalRole = request.user.role as Role;

        request.projectAccess = { globalRole, localRole: null };

        const targetUserId = params.userId != null ? Number(params.userId) : undefined;

        if (options?.checkSelfModification) {
            if (targetUserId !== undefined && targetUserId === userId) {
                throw new AppError(HTTP_STATUS.FORBIDDEN, "Cannot change your own role", "SELF_ROLE_CHANGE");
            }
        }

        if (options?.allowSelfLeave) {
            if (targetUserId !== undefined && targetUserId === userId) {
                return;
            }
        }

        if (options?.allowGlobalAdmin && globalRole === Role.ADMIN) return;

        const member = await request.server.prisma.projectMember.findUnique({
            where: { userId_projectId: { userId, projectId } },
        });

        if (!member) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, "Access denied", "AUTH_FORBIDDEN");
        }

        request.projectAccess.localRole = member.role;

        if (options?.checkRoleHierarchy) {
            const targetRole = (request.body as Record<string, unknown> | undefined)?.role as string | undefined;
            if (targetRole) {
                const actorRank = ROLE_HIERARCHY[member.role] ?? 0;
                const targetRank = ROLE_HIERARCHY[targetRole] ?? 0;
                if (targetRank > actorRank) {
                    throw new AppError(HTTP_STATUS.FORBIDDEN, "Insufficient role hierarchy", "ROLE_HIERARCHY");
                }
            }
        }

        if (options?.requiredRoles && !options.requiredRoles.includes(member.role)) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, "Access denied", "AUTH_FORBIDDEN");
        }
    };
};
