/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { describe, expect, it, vi } from "vitest";

import { Role } from "@/generated/prisma/client.js";
import { ProjectMemberRole } from "@/generated/prisma/enums.js";

import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";

import { createProjectAccessGuard, getManagerProjectIds, resolveProjectAccess } from "./index.js";

describe("getManagerProjectIds", () => {
    it("returns project IDs where user is MANAGER", async () => {
        const mockPrisma = {
            projectMember: {
                findMany: vi.fn().mockResolvedValue([
                    { projectId: 1 },
                    { projectId: 3 },
                ]),
            },
        };

        const result = await getManagerProjectIds(mockPrisma as never, 5);

        expect(result).toEqual([1, 3]);
        expect(mockPrisma.projectMember.findMany).toHaveBeenCalledWith({
            where: { userId: 5, role: "MANAGER" },
            select: { projectId: true },
        });
    });

    it("returns empty array when user has no memberships", async () => {
        const mockPrisma = {
            projectMember: {
                findMany: vi.fn().mockResolvedValue([]),
            },
        };

        const result = await getManagerProjectIds(mockPrisma as never, 999);

        expect(result).toEqual([]);
    });
});

describe("resolveProjectAccess", () => {
    const createMockRequest = (overrides: Record<string, unknown> = {}) => {
        const req: Record<string, unknown> = {
            user: { sub: "1", role: Role.USER },
            server: {
                prisma: {
                    projectMember: {
                        findUnique: vi.fn().mockResolvedValue({
                            userId: 1,
                            projectId: 10,
                            role: ProjectMemberRole.DEVELOPER,
                        }),
                    },
                },
            },
            projectAccess: { globalRole: "" as Role, localRole: null },
            ...overrides,
        };
        return req as never;
    };

    it("allows ADMIN to bypass access check by default", async () => {
        const request = createMockRequest({
            user: { sub: "1", role: Role.ADMIN },
        });

        await resolveProjectAccess(request as never, 10);

        const access = (request as never as { projectAccess: { globalRole: Role } }).projectAccess;
        expect(access.globalRole).toBe(Role.ADMIN);
    });

    it("throws FORBIDDEN for ADMIN with allowAdmin=false when no membership", async () => {
        const request = createMockRequest({
            user: { sub: "1", role: Role.ADMIN },
            server: {
                prisma: {
                    projectMember: {
                        findUnique: vi.fn().mockResolvedValue(null),
                    },
                },
            },
        });

        await expect(
            resolveProjectAccess(request as never, 10, { allowAdmin: false }),
        ).rejects.toThrow(AppError);
    });

    it("throws FORBIDDEN for non-member", async () => {
        const request = createMockRequest({
            server: {
                prisma: {
                    projectMember: {
                        findUnique: vi.fn().mockResolvedValue(null),
                    },
                },
            },
        });

        await expect(
            resolveProjectAccess(request as never, 10),
        ).rejects.toThrow(AppError);
    });

    it("throws FORBIDDEN when member role is not in requiredRoles", async () => {
        const request = createMockRequest();

        await expect(
            resolveProjectAccess(request as never, 10, {
                requiredRoles: [ProjectMemberRole.MANAGER],
            }),
        ).rejects.toThrow(AppError);
    });

    it("sets localRole for valid member", async () => {
        const request = createMockRequest();

        await resolveProjectAccess(request as never, 10);

        const access = (request as never as { projectAccess: { localRole: ProjectMemberRole | null } }).projectAccess;
        expect(access.localRole).toBe(ProjectMemberRole.DEVELOPER);
    });

    it("allows member with sufficient role for requiredRoles", async () => {
        const request = createMockRequest();

        await resolveProjectAccess(request as never, 10, {
            requiredRoles: [ProjectMemberRole.DEVELOPER],
        });

        const access = (request as never as { projectAccess: { localRole: ProjectMemberRole | null } }).projectAccess;
        expect(access.localRole).toBe(ProjectMemberRole.DEVELOPER);
    });
});

describe("createProjectAccessGuard", () => {
    const buildRequest = (overrides: Record<string, unknown> = {}) => {
        const req: Record<string, unknown> = {
            user: { sub: "1", role: Role.USER },
            params: { id: "10" },
            body: {},
            server: {
                prisma: {
                    project: {
                        findUnique: vi.fn().mockResolvedValue({ id: 10 }),
                    },
                    projectMember: {
                        findUnique: vi.fn().mockResolvedValue({
                            userId: 1,
                            projectId: 10,
                            role: ProjectMemberRole.DEVELOPER,
                        }),
                    },
                },
            },
            projectAccess: { globalRole: "" as Role, localRole: null },
            ...overrides,
        };
        return req as never;
    };

    it("returns a preHandlerHookHandler function", () => {
        const guard = createProjectAccessGuard();
        expect(guard).toBeInstanceOf(Function);
    });

    it("allows ADMIN to bypass check with allowGlobalAdmin", async () => {
        const request = buildRequest({
            user: { sub: "1", role: Role.ADMIN },
        });
        const guard = createProjectAccessGuard({ allowGlobalAdmin: true });

        await guard(request as never, undefined as never);

        const access = (request as never as { projectAccess: { globalRole: Role } }).projectAccess;
        expect(access.globalRole).toBe(Role.ADMIN);
    });

    it("throws FORBIDDEN for non-member", async () => {
        const request = buildRequest({
            server: {
                prisma: {
                    project: {
                        findUnique: vi.fn().mockResolvedValue({ id: 10 }),
                    },
                    projectMember: {
                        findUnique: vi.fn().mockResolvedValue(null),
                    },
                },
            },
        });
        const guard = createProjectAccessGuard({ allowGlobalAdmin: true });

        await expect(guard(request as never, undefined as never)).rejects.toThrow(AppError);
    });

    it("throws FORBIDDEN when checkSelfModification is enabled and target is self", async () => {
        const request = buildRequest({
            params: { id: "10", userId: "1" },
            user: { sub: "1", role: Role.USER },
        });
        const guard = createProjectAccessGuard({ checkSelfModification: true });

        await expect(guard(request as never, undefined as never)).rejects.toThrow(AppError);
    });

    it("allows self leave when allowSelfLeave is enabled", async () => {
        const request = buildRequest({
            params: { id: "10", userId: "1" },
            user: { sub: "1", role: Role.USER },
        });
        const guard = createProjectAccessGuard({ allowSelfLeave: true });

        await guard(request as never, undefined as never);
        // Should not throw
    });

    it("throws FORBIDDEN when requiredRoles not met", async () => {
        const request = buildRequest();
        const guard = createProjectAccessGuard({
            requiredRoles: [ProjectMemberRole.MANAGER],
        });

        await expect(guard(request as never, undefined as never)).rejects.toThrow(AppError);
    });

    it("throws FORBIDDEN when role hierarchy check fails", async () => {
        const request = buildRequest({
            body: { role: ProjectMemberRole.MANAGER },
        });
        const guard = createProjectAccessGuard({ checkRoleHierarchy: true });

        await expect(guard(request as never, undefined as never)).rejects.toThrow(AppError);
    });

    it("passes for member with sufficient role when requiredRoles met", async () => {
        const request = buildRequest();
        const guard = createProjectAccessGuard({
            requiredRoles: [ProjectMemberRole.DEVELOPER],
        });

        await guard(request as never, undefined as never);
        // Should not throw
    });
});
