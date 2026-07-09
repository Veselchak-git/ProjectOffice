import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";
import type { ProjectMemberRole } from "@/generated/prisma/enums.js";

import type {
    ProjectListResponse,
    ProjectDetailResponse,
    CreateProjectBody,
    UpdateProjectBody,
    AddMemberBody,
    UpdateMemberRoleBody,
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

const mapProject = (p: {
    id: number;
    name: string;
    description: string | null;
    status: string;
    createdAt: Date;
    _count: { versions: number; issues: number };
    memberships: { user: { login: string }; role: string }[];
    versions: { version: string }[];
}) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status as "ACTIVE" | "ARCHIVED",
    versionCount: p._count.versions,
    versions: p.versions.map(v => v.version),
    taskCount: p._count.issues,
    responsible: findResponsible(p.memberships),
    createdAt: p.createdAt.toISOString(),
});

export const getProjectsListService = async (
    request: FastifyRequestTypeBox<typeof getProjectsListSchema>
): Promise<ProjectListResponse> => {
    const prisma = request.server.prisma;

    const projects = await prisma.project.findMany({
        include: {
            _count: { select: { versions: true, issues: true } },
            memberships: { select: { role: true, user: { select: { login: true } } } },
            versions: { select: { version: true }, orderBy: { id: "desc" } },
        },
        orderBy: { createdAt: "desc" },
    });

    const mapped = projects.map(mapProject);

    return {
        projects: mapped,
        total: mapped.length,
        active: mapped.filter(p => p.status === "ACTIVE").length,
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
            versions: { select: { version: true }, orderBy: { id: "desc" } },
        },
    });

    if (!project) {
        const httpError = new Error("Проект не найден") as Error & { statusCode?: number };
        httpError.statusCode = 404;
        throw httpError;
    }

    return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status as "ACTIVE" | "ARCHIVED",
        versionCount: project._count.versions,
        versions: project.versions.map(v => v.version),
        taskCount: project._count.issues,
        responsible: findResponsible(project.memberships),
        createdAt: project.createdAt.toISOString(),
    };
};

export const createProjectService = async (
    request: FastifyRequestTypeBox<typeof createProjectSchema>
): Promise<{ id: number; name: string }> => {
    const prisma = request.server.prisma;
    const { name, description, versions } = request.body as CreateProjectBody;

    const project = await prisma.project.create({
        data: {
            name,
            description: description ?? null,
            versions: {
                create: versions.map(v => ({ version: v })),
            },
        },
    });

    return { id: project.id, name: project.name };
};

export const updateProjectService = async (
    request: FastifyRequestTypeBox<typeof updateProjectSchema>
): Promise<{ id: number; name: string }> => {
    const prisma = request.server.prisma;
    const { id } = request.params;
    const body = request.body as UpdateProjectBody;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
        const httpError = new Error("Проект не найден") as Error & { statusCode?: number };
        httpError.statusCode = 404;
        throw httpError;
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;

    if (body.versions !== undefined) {
        await prisma.productVersion.deleteMany({ where: { projectId: id } });
        await prisma.productVersion.createMany({
            data: body.versions.map(v => ({ projectId: id, version: v })),
        });
    }

    if (Object.keys(updateData).length > 0) {
        await prisma.project.update({ where: { id }, data: updateData });
    }

    const project = await prisma.project.findUnique({
        where: { id },
        select: { id: true, name: true },
    });

    return { id: project!.id, name: project!.name };
};

export const getUsersService = async (
    request: FastifyRequestTypeBox<never>
): Promise<{ id: number; login: string; role: string }[]> => {
    const prisma = request.server.prisma;
    const users = await prisma.user.findMany({ select: { id: true, login: true, role: true } });
    return users;
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
    const { userId, role } = request.body as AddMemberBody;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { login: true } });
    if (!user) {
        const httpError = new Error("Пользователь не найден") as Error & { statusCode?: number };
        httpError.statusCode = 404;
        throw httpError;
    }

    const existing = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId: id } },
    });
    if (existing) {
        const httpError = new Error("Участник уже добавлен в проект") as Error & { statusCode?: number };
        httpError.statusCode = 409;
        throw httpError;
    }

    await prisma.projectMember.create({
        data: { userId, projectId: id, role: role as ProjectMemberRole },
    });

    const member = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId: id } },
        select: { userId: true, role: true, user: { select: { login: true } } },
    });

    return { userId: member!.userId, login: member!.user.login, role: member!.role };
};

export const updateProjectMemberService = async (
    request: FastifyRequestTypeBox<typeof updateProjectMemberSchema>
): Promise<MemberResponse> => {
    const prisma = request.server.prisma;
    const { id, userId } = request.params;
    const { role } = request.body as UpdateMemberRoleBody;

    const existing = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId: id } },
    });
    if (!existing) {
        const httpError = new Error("Участник не найден в проекте") as Error & { statusCode?: number };
        httpError.statusCode = 404;
        throw httpError;
    }

    await prisma.projectMember.update({
        where: { userId_projectId: { userId, projectId: id } },
        data: { role: role as ProjectMemberRole },
    });

    const member = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId: id } },
        select: { userId: true, role: true, user: { select: { login: true } } },
    });

    return { userId: member!.userId, login: member!.user.login, role: member!.role };
};

export const deleteProjectService = async (
    request: FastifyRequestTypeBox<typeof deleteProjectSchema>
): Promise<null> => {
    const prisma = request.server.prisma;
    const { id } = request.params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
        const httpError = new Error("Проект не найден") as Error & { statusCode?: number };
        httpError.statusCode = 404;
        throw httpError;
    }

    await prisma.productVersion.deleteMany({ where: { projectId: id } });
    await prisma.projectMember.deleteMany({ where: { projectId: id } });
    await prisma.issue.deleteMany({ where: { projectId: id } });
    await prisma.project.delete({ where: { id } });

    return null;
};

export const removeProjectMemberService = async (
    request: FastifyRequestTypeBox<typeof deleteProjectMemberSchema>
): Promise<null> => {
    const prisma = request.server.prisma;
    const { id, userId } = request.params;

    const existing = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId: id } },
    });
    if (!existing) {
        const httpError = new Error("Участник не найден в проекте") as Error & { statusCode?: number };
        httpError.statusCode = 404;
        throw httpError;
    }

    await prisma.projectMember.delete({
        where: { userId_projectId: { userId, projectId: id } },
    });

    return null;
};
