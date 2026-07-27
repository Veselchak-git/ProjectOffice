/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * �������������� ����� (c) 2016-2026 ����������� ��� �����
 * ��� ����� ��������
 */
import { Role } from "@/generated/prisma/client.js";

import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";
import { defaultBuildTestApp } from "@/shared/lib/testing/defaultBuildTestApp.test-helper.js";

import { auditLogEmitter } from "@/modules/audit-log/emitter.js";

import {
    getProjectsListService,
    getProjectsExportService,
    getProjectByIdService,
    createProjectService,
    updateProjectService,
    getProjectMembersService,
    addProjectMemberService,
    updateProjectMemberService,
    deleteProjectService,
    removeProjectMemberService,
} from "../service.js";

vi.mock("@/modules/audit-log/emitter.js", () => ({
    auditLogEmitter: {
        emitAuditLog: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock("@/shared/lib/assert-last-role/index.js", () => ({
    assertNotLastOfRole: vi.fn().mockResolvedValue(undefined),
}));

const mockProjects = [
    {
        id: 1,
        name: "Project A",
        description: "Desc A",
        status: "ACTIVE",
        createdAt: new Date("2025-01-01"),
        _count: { versions: 2, issues: 5 },
        memberships: [{ role: "MANAGER", user: { login: "admin@example.com" } }],
        versions: [{ id: 1, version: "1.0" }, { id: 2, version: "2.0" }],
    },
    {
        id: 2,
        name: "Project B",
        description: "Desc B",
        status: "ARCHIVED",
        createdAt: new Date("2025-02-01"),
        _count: { versions: 1, issues: 3 },
        memberships: [{ role: "VIEWER", user: { login: "user@example.com" } }],
        versions: [{ id: 3, version: "1.0" }],
    },
];

const initialProjects = mockProjects.map(p => ({ ...p }));

const buildTestApp = async () => {
    const fastify = defaultBuildTestApp();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    const mockPrisma: any = {
        $transaction: async (fn: any) => {
            if (typeof fn === "function") return fn(mockPrisma);
            const results = await Promise.all(fn);
            return results;
        },
        project: {
            findMany: async (_args?: any) => [...mockProjects],
            findUnique: async (args: any) => mockProjects.find((p: any) => p.id === args.where.id) ?? null,
            findFirst: async (args: any) => mockProjects.find((p: any) => p.name === args.where?.name) ?? null,
            count: async (args?: any) => {
                const where = args?.where;
                if (where?.status === "ACTIVE") {
                    return mockProjects.filter(p => p.status === "ACTIVE").length;
                }
                return mockProjects.length;
            },
            create: async (args: any) => ({ id: 3, name: args.data.name, description: args.data.description }),
            update: async (args: any) => {
                const idx = mockProjects.findIndex((p: any) => p.id === args.where.id);
                if (idx !== -1) {
                    Object.assign(mockProjects[idx]!, args.data);
                    return { ...mockProjects[idx] };
                }
                return { ...args.data };
            },
            delete: async () => {},
        },
        projectMember: {
            findMany: async (_args: any) => [
                { userId: 1, role: "MANAGER", user: { login: "admin@example.com" } },
            ],
            findUnique: async (args: any) => {
                if (args.where?.userId_projectId) {
                    return { userId: 1, projectId: 1, role: "MANAGER", user: { login: "admin@example.com" } };
                }
                return null;
            },
            count: async () => 2,
            create: async (args: any) => ({
                userId: args.data.userId,
                role: args.data.role,
                user: { login: "newuser@example.com" },
            }),
            update: async (args: any) => ({
                userId: args.where.userId_projectId.userId,
                role: args.data.role,
                user: { login: "admin@example.com" },
            }),
            delete: async () => {},
            deleteMany: async () => {},
        },
        user: {
            findUnique: async (args: any) => {
                if (args.where?.id === 999) return null;
                return { id: args.where.id, login: "test@example.com", role: "USER" };
            },
        },
        productVersion: {
            deleteMany: async () => {},
            create: async (args: any) => ({ id: 1, version: args.data.version }),
        },
        issue: {
            deleteMany: async () => {},
        },
    };

    fastify.decorate("prisma", mockPrisma);

    return fastify;
};

const buildRequest = (app: Awaited<ReturnType<typeof buildTestApp>>, overrides: Record<string, unknown> = {}) =>
    ({
        server: app,
        user: { sub: "1", login: "admin@example.com", role: Role.ADMIN },
        query: { page: 1, perPage: 20, sortBy: undefined, sortOrder: "desc", filter: undefined },
        body: {},
        params: {},
        ...overrides,
    }) as any;

describe("projects service", () => {
    let app: Awaited<ReturnType<typeof buildTestApp>>;

    beforeEach(async () => {
        // Reset mockProjects to initial state
        mockProjects.splice(0, mockProjects.length, ...initialProjects.map(p => ({ ...p })));
        app = await buildTestApp();
        vi.clearAllMocks();
    });

    afterEach(async () => {
        await app?.close();
    });

    describe("getProjectsListService", () => {
        it("returns projects with pagination info for ADMIN", async () => {
            const request = buildRequest(app);

            const result = await getProjectsListService(request);

            expect(result.projects).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.active).toBe(1);
            expect(result.page).toBe(1);
            expect(result.perPage).toBe(20);
            expect(result.projects[0]!.name).toBe("Project A");
            expect(result.projects[0]!.status).toBe("ACTIVE");
            expect(result.projects[0]!.responsible).toBe("admin@example.com");
        });

        it("returns projects for non-ADMIN user", async () => {
            const request = buildRequest(app, {
                user: { sub: "2", login: "user@example.com", role: Role.USER },
            });

            const result = await getProjectsListService(request);

            expect(result.projects).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it("passes correct pagination params", async () => {
            const mockProject = {
                id: 1, name: "Project A", description: "Desc A", status: "ACTIVE",
                createdAt: new Date("2025-01-01"), _count: { versions: 2, issues: 5 },
                memberships: [{ role: "MANAGER", user: { login: "admin@example.com" } }],
                versions: [{ id: 1, version: "1.0" }, { id: 2, version: "2.0" }],
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.$transaction as any) = async (fn: any) => {
                if (typeof fn === "function") return fn(app.prisma);
                return [[mockProject], 10, 5];
            };

            const request = buildRequest(app, {
                query: { page: 2, perPage: 5, sortBy: undefined, sortOrder: "asc", filter: undefined },
            });

            const result = await getProjectsListService(request);

            expect(result.total).toBe(10);
            expect(result.page).toBe(2);
            expect(result.perPage).toBe(5);
        });
    });

    describe("getProjectsExportService", () => {
        it("returns projects without pagination for ADMIN", async () => {
            const request = buildRequest(app, {
                query: { filter: undefined, sortBy: undefined, sortOrder: "desc" },
            });

            const result = await getProjectsExportService(request);

            expect(result.projects).toHaveLength(2);
            expect(result.projects[0]!.name).toBe("Project A");
            expect(result.projects[1]!.name).toBe("Project B");
        });
    });

    describe("getProjectByIdService", () => {
        it("returns project detail", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
            });

            const result = await getProjectByIdService(request);

            expect(result.id).toBe(1);
            expect(result.name).toBe("Project A");
            expect(result.description).toBe("Desc A");
            expect(result.status).toBe("ACTIVE");
            expect(result.versionCount).toBe(2);
            expect(result.taskCount).toBe(5);
            expect(result.responsible).toBe("admin@example.com");
            expect(result.versions).toHaveLength(2);
        });

        it("includes myRole when user is a member", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                user: { sub: "1", login: "admin@example.com", role: Role.ADMIN },
            });

            const result = await getProjectByIdService(request);

            expect(result.myRole).toBe("MANAGER");
        });

        it("throws 404 for non-existent project", async () => {
            const request = buildRequest(app, {
                params: { id: 999 },
            });

            await expect(getProjectByIdService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.NOT_FOUND, "Project not found", "PROJECT_NOT_FOUND"),
            );
        });
    });

    describe("createProjectService", () => {
        it("creates a new project and emits audit log", async () => {
            const request = buildRequest(app, {
                body: { name: "New Project", description: "New Desc", versions: ["1.0", "2.0"] },
            });

            const result = await createProjectService(request);

            expect(result.id).toBeDefined();
            expect(result.name).toBe("New Project");
            expect(auditLogEmitter.emitAuditLog).toHaveBeenCalledWith(app.prisma, expect.objectContaining({
                eventType: "PROJECT_CREATED",
                subjectType: "USER",
                objectType: "PROJECT",
            }));
        });

        it("throws 409 for duplicate name", async () => {
            const request = buildRequest(app, {
                body: { name: "Project A", description: "Desc", versions: ["1.0"] },
            });

            await expect(createProjectService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.CONFLICT, "A project with this name already exists", "PROJECT_ALREADY_EXISTS"),
            );
        });
    });

    describe("updateProjectService", () => {
        it("updates a project and emits audit log", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                body: { name: "Updated Project" },
            });

            const result = await updateProjectService(request);

            expect(result.id).toBe(1);
            expect(result.name).toBe("Updated Project");
            expect(auditLogEmitter.emitAuditLog).toHaveBeenCalledWith(app.prisma, expect.objectContaining({
                eventType: "PROJECT_UPDATED",
            }));
        });

        it("updates project versions", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                body: { versions: ["3.0", "4.0"] },
            });

            const result = await updateProjectService(request);

            expect(result.id).toBe(1);
        });

        it("throws 404 for non-existent project", async () => {
            const request = buildRequest(app, {
                params: { id: 999 },
                body: { name: "New Name" },
            });

            await expect(updateProjectService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.NOT_FOUND, "Project not found", "PROJECT_NOT_FOUND"),
            );
        });

        it("throws 409 when name is already taken", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                body: { name: "Project B" },
            });

            await expect(updateProjectService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.CONFLICT, "A project with this name already exists", "PROJECT_ALREADY_EXISTS"),
            );
        });

        it("allows keeping the same name", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                body: { name: "Project A" },
            });

            const result = await updateProjectService(request);

            expect(result.name).toBe("Project A");
        });
    });

    describe("getProjectMembersService", () => {
        it("returns members for a project", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
            });

            const result = await getProjectMembersService(request);

            expect(result).toHaveLength(1);
            expect(result[0]!.userId).toBe(1);
            expect(result[0]!.login).toBe("admin@example.com");
            expect(result[0]!.role).toBe("MANAGER");
        });
    });

    describe("addProjectMemberService", () => {
        it("adds a member and emits audit log", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.projectMember.findUnique as any) = async () => null;

            const request = buildRequest(app, {
                params: { id: 1 },
                body: { userId: 2, role: "VIEWER" },
            });

            const result = await addProjectMemberService(request);

            expect(result.userId).toBeDefined();
            expect(result.role).toBe("VIEWER");
            expect(auditLogEmitter.emitAuditLog).toHaveBeenCalledWith(app.prisma, expect.objectContaining({
                eventType: "MEMBER_ADDED",
            }));
        });

        it("throws 404 for non-existent user", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.projectMember.findUnique as any) = async () => null;

            const request = buildRequest(app, {
                params: { id: 1 },
                body: { userId: 999, role: "VIEWER" },
            });

            await expect(addProjectMemberService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.NOT_FOUND, "User not found", "USER_NOT_FOUND"),
            );
        });

        it("throws 409 for existing member", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
                body: { userId: 1, role: "VIEWER" },
            });

            await expect(addProjectMemberService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.CONFLICT, "Member already exists", "MEMBER_ALREADY_EXISTS"),
            );
        });
    });

    describe("updateProjectMemberService", () => {
        it("updates member role and emits audit log", async () => {
            const request = buildRequest(app, {
                params: { id: 1, userId: 1 },
                body: { role: "VIEWER" },
            });

            const result = await updateProjectMemberService(request);

            expect(result.userId).toBe(1);
            expect(result.role).toBe("VIEWER");
            expect(auditLogEmitter.emitAuditLog).toHaveBeenCalledWith(app.prisma, expect.objectContaining({
                eventType: "MEMBER_UPDATED",
            }));
        });

        it("throws 404 for non-existent member", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.projectMember.findUnique as any) = async () => null;

            const request = buildRequest(app, {
                params: { id: 1, userId: 999 },
                body: { role: "VIEWER" },
            });

            await expect(updateProjectMemberService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.NOT_FOUND, "Member not found", "MEMBER_NOT_FOUND"),
            );
        });
    });

    describe("deleteProjectService", () => {
        it("deletes a project and emits audit log", async () => {
            const request = buildRequest(app, {
                params: { id: 1 },
            });

            const result = await deleteProjectService(request);

            expect(result).toBeNull();
            expect(auditLogEmitter.emitAuditLog).toHaveBeenCalledWith(app.prisma, expect.objectContaining({
                eventType: "PROJECT_DELETED",
                subjectType: "USER",
                objectType: "PROJECT",
            }));
        });

        it("throws 404 for non-existent project", async () => {
            const request = buildRequest(app, {
                params: { id: 999 },
            });

            await expect(deleteProjectService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.NOT_FOUND, "Project not found", "PROJECT_NOT_FOUND"),
            );
        });
    });

    describe("removeProjectMemberService", () => {
        it("removes a member and emits audit log", async () => {
            const request = buildRequest(app, {
                params: { id: 1, userId: 1 },
            });

            const result = await removeProjectMemberService(request);

            expect(result).toBeNull();
            expect(auditLogEmitter.emitAuditLog).toHaveBeenCalledWith(app.prisma, expect.objectContaining({
                eventType: "MEMBER_REMOVED",
            }));
        });

        it("throws 404 for non-existent member", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
            (app.prisma.projectMember.findUnique as any) = async () => null;

            const request = buildRequest(app, {
                params: { id: 1, userId: 999 },
            });

            await expect(removeProjectMemberService(request)).rejects.toThrow(
                new AppError(HTTP_STATUS.NOT_FOUND, "Member not found", "MEMBER_NOT_FOUND"),
            );
        });
    });
});
