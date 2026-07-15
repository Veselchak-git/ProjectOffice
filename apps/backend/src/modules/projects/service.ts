import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";
import { ProjectMemberRole, Role } from "@/generated/prisma/enums.js";
import { Prisma } from "@/generated/prisma/client.js";
import { assertNotLastOfRole } from "@/shared/lib/assert-last-role/index.js";
import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";
import { buildOrderBy, paginationArgs } from "@/shared/lib/prisma-pagination/index.js";

import type {
    ProjectListResponse,
    ProjectDetailResponse,
    MemberResponse,
} from "./schema.js";

import {
    getProjectsListSchema,
    getProjectByIdSchema,
    createProjectSchema,
    updateProjectSchema,
    getProjectMembersSchema,
    addProjectMemberSchema,
    updateProjectMemberSchema,
    deleteProjectMemberSchema,
    deleteProjectSchema,
} from "./schema.js";

const findResponsible = (memberships: { user: { login: string }; role: string }[]): string => {
    const manager = memberships.find(m => m.role === "MANAGER");
    return manager?.user.login ?? memberships[0]?.user.login ?? "";
};

const PROJECT_SORT_FIELDS = new Set(["name", "status", "createdAt", "taskCount", "versionCount"]);

const buildProjectOrderBy = (sortBy: string | undefined, sortOrder: string): Record<string, unknown> =>
    buildOrderBy(PROJECT_SORT_FIELDS, sortBy, sortOrder, { createdAt: "desc" }, {
        taskCount: order => ({ issues: { _count: order } }),
        versionCount: order => ({ versions: { _count: order } }),
    });

const mapProject = (p: {
    id: number;
    name: string;
    description: string | null;
    status: string;
    createdAt: Date;
    _count: { versions: number; issues: number };
    memberships: { user: { login: string }; role: string }[];
    versions: { id: number; version: string }[];
}) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status as "ACTIVE" | "ARCHIVED",
    versionCount: p._count.versions,
    versions: p.versions.map(v => ({ id: v.id, version: v.version })),
    taskCount: p._count.issues,
    responsible: findResponsible(p.memberships),
    createdAt: p.createdAt.toISOString(),
});

export const getProjectsListService = async (
    request: FastifyRequestTypeBox<typeof getProjectsListSchema>
): Promise<ProjectListResponse> => {
    const prisma = request.server.prisma;
    const { q, page = 1, perPage = 20, sortBy, sortOrder = "desc" } = request.query;

    const userId = Number(request.user.sub);
    const userRole = request.user.role;

    const where: Record<string, unknown> = {};
    if (q) where.name = { contains: q };
    if (userRole !== Role.ADMIN) {
        where.memberships = { some: { userId } };
    }
    const orderBy = buildProjectOrderBy(sortBy, sortOrder);
    const { skip, take } = paginationArgs(page, perPage);

    const include = {
        _count: { select: { versions: true, issues: true } },
        memberships: { select: { role: true, user: { select: { login: true } } } },
        versions: { select: { id: true, version: true }, orderBy: { id: "desc" as const } },
    } as const;

    const [projects, total, active] = await prisma.$transaction([
        prisma.project.findMany({ where, orderBy, skip, take, include }),
        prisma.project.count({ where }),
        prisma.project.count({ where: { ...where, status: "ACTIVE" } }),
    ]);

    return {
        projects: projects.map(mapProject),
        total,
        active,
        page,
        perPage,
    };
};

export const getProjectByIdService = async (
    request: FastifyRequestTypeBox<typeof getProjectByIdSchema>
): Promise<ProjectDetailResponse> => {
    const prisma = request.server.prisma;
    const { id } = request.params;

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            _count: { select: { versions: true, issues: true } },
            memberships: { select: { role: true, user: { select: { login: true } } } },
            versions: { select: { id: true, version: true }, orderBy: { id: "desc" } },
        },
    });

    if (!project) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, "Проект не найден", "PROJECT_NOT_FOUND");
    }

    const myMembership = project.memberships.find(
        m => m.user.login === request.user.login,
    );

    return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status as "ACTIVE" | "ARCHIVED",
        versionCount: project._count.versions,
        versions: project.versions.map(v => ({ id: v.id, version: v.version })),
        taskCount: project._count.issues,
        responsible: findResponsible(project.memberships),
        createdAt: project.createdAt.toISOString(),
        ...(myMembership ? { myRole: myMembership.role } : {}),
    };
};

export const createProjectService = async (
    request: FastifyRequestTypeBox<typeof createProjectSchema>
): Promise<{ id: number; name: string }> => {
    const prisma = request.server.prisma;
    const { name, description, versions } = request.body;

    const project = await prisma.project.create({
        data: {
            name,
            description: description ?? null,
            versions: {
                create: versions.map(v => ({ version: v })),
            },
        },
    });

    const creatorId = Number(request.user.sub);

    await prisma.projectMember.create({
        data: {
            userId: creatorId,
            projectId: project.id,
            role: ProjectMemberRole.MANAGER,
        },
    });

    return { id: project.id, name: project.name };
};

export const updateProjectService = async (
    request: FastifyRequestTypeBox<typeof updateProjectSchema>
): Promise<{ id: number; name: string }> => {
    const prisma = request.server.prisma;
    const { id } = request.params;
    const body = request.body;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, "Проект не найден", "PROJECT_NOT_FOUND");
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;

    if (body.versions !== undefined) {
        await prisma.$transaction([
            prisma.productVersion.deleteMany({ where: { projectId: id } }),
            ...body.versions.map(v =>
                prisma.productVersion.create({ data: { projectId: id, version: v } }),
            ),
        ]);
    }

    if (Object.keys(updateData).length > 0) {
        await prisma.project.update({ where: { id }, data: updateData });
    }

    const project = await prisma.project.findUnique({
        where: { id },
        select: { id: true, name: true },
    });

    if (!project) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, "Проект не найден", "PROJECT_NOT_FOUND");
    }

    return { id: project.id, name: project.name };
};

export const getProjectMembersService = async (
    request: FastifyRequestTypeBox<typeof getProjectMembersSchema>
): Promise<MemberResponse[]> => {
    const prisma = request.server.prisma;
    const { id } = request.params;

    const members = await prisma.projectMember.findMany({
        where: { projectId: id },
        select: { userId: true, role: true, user: { select: { login: true } } },
    });

    return members.map(m => ({ userId: m.userId, login: m.user.login, role: m.role }));
};

export const addProjectMemberService = async (
    request: FastifyRequestTypeBox<typeof addProjectMemberSchema>
): Promise<MemberResponse> => {
    const prisma = request.server.prisma;
    const { id } = request.params;
    const { userId, role } = request.body;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { login: true, role: true } });
    if (!user) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, "Пользователь не найден", "USER_NOT_FOUND");
    }
    if (user.role === "GUEST") {
        throw new AppError(HTTP_STATUS.FORBIDDEN, "Нельзя добавить гостя в проект", "GUEST_NOT_ALLOWED");
    }

    const existing = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId: id } },
    });
    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, "Участник уже добавлен в проект", "MEMBER_ALREADY_EXISTS");
    }

    const member = await prisma.projectMember.create({
        data: { userId, projectId: id, role },
        select: { userId: true, role: true, user: { select: { login: true } } },
    });

    return { userId: member.userId, login: member.user.login, role: member.role };
};

export const updateProjectMemberService = async (
    request: FastifyRequestTypeBox<typeof updateProjectMemberSchema>
): Promise<MemberResponse> => {
    const prisma = request.server.prisma;
    const { id, userId } = request.params;
    const { role } = request.body;

    const member = await prisma.$transaction(async tx => {
        const existing = await tx.projectMember.findUnique({
            where: { userId_projectId: { userId, projectId: id } },
        });
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, "Участник не найден в проекте", "MEMBER_NOT_FOUND");
        }

        if (existing.role === "MANAGER" && role !== "MANAGER") {
            await assertNotLastOfRole(
                tx.projectMember,
                { projectId: id, role: "MANAGER" },
                "Нельзя понизить единственного менеджера проекта",
                "LAST_MANAGER",
            );
        }

        return tx.projectMember.update({
            where: { userId_projectId: { userId, projectId: id } },
            data: { role },
            select: { userId: true, role: true, user: { select: { login: true } } },
        });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return { userId: member.userId, login: member.user.login, role: member.role };
};

export const deleteProjectService = async (
    request: FastifyRequestTypeBox<typeof deleteProjectSchema>
): Promise<null> => {
    const prisma = request.server.prisma;
    const { id } = request.params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, "Проект не найден", "PROJECT_NOT_FOUND");
    }

    await prisma.$transaction([
        prisma.productVersion.deleteMany({ where: { projectId: id } }),
        prisma.projectMember.deleteMany({ where: { projectId: id } }),
        prisma.issue.deleteMany({ where: { projectId: id } }),
        prisma.project.delete({ where: { id } }),
    ]);

    return null;
};

export const removeProjectMemberService = async (
    request: FastifyRequestTypeBox<typeof deleteProjectMemberSchema>
): Promise<null> => {
    const prisma = request.server.prisma;
    const { id, userId } = request.params;

    await prisma.$transaction(async tx => {
        const existing = await tx.projectMember.findUnique({
            where: { userId_projectId: { userId, projectId: id } },
        });
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, "Участник не найден в проекте", "MEMBER_NOT_FOUND");
        }

        if (existing.role === "MANAGER") {
            await assertNotLastOfRole(
                tx.projectMember,
                { projectId: id, role: "MANAGER" },
                "Нельзя удалить единственного менеджера проекта",
                "LAST_MANAGER",
            );
        }

        await tx.projectMember.delete({
            where: { userId_projectId: { userId, projectId: id } },
        });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return null;
};
