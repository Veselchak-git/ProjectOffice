/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 * 
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

import { buildFilter, parseFilterQuery } from "../../shared/lib/filter/index.js";
import type { FilterGroup } from "../../shared/lib/filter/types.js";
import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";
import { ProjectMemberRole, Role } from "@/generated/prisma/enums.js";
import { Prisma } from "@/generated/prisma/client.js";
import { assertNotLastOfRole } from "@/shared/lib/assert-last-role/index.js";
import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";

import { buildOrderBy, paginationArgs } from "@/shared/lib/prisma-pagination/index.js";
import { auditLogEmitter } from "@/modules/audit-log/emitter.js";

import type {
    ProjectListResponse,
    ProjectDetailResponse,
    MemberResponse,
    ProjectResponse,
} from "./schema.js";

import {
    getProjectsListSchema,
    getProjectsExportSchema,
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

function buildResponsibleFilter(filterQueryParsed: FilterGroup | undefined): Record<string, unknown> | undefined {
    if (!filterQueryParsed) return undefined;
    for (const c of filterQueryParsed.conditions) {
        if (c.field === "responsible" && typeof c.value === "string") {
            if (c.operator === "eq") {
                return { memberships: { some: { user: { login: c.value } } } };
            } else if (c.operator === "neq") {
                return { NOT: { memberships: { some: { user: { login: c.value } } } } };
            } else if (c.operator === "contains") {
                return { memberships: { some: { user: { login: { contains: c.value, mode: "insensitive" } } } } };
            } else if (c.operator === "not_contains") {
                return { NOT: { memberships: { some: { user: { login: { contains: c.value, mode: "insensitive" } } } } } };
            } else if (c.operator === "starts_with") {
                return { memberships: { some: { user: { login: { startsWith: c.value, mode: "insensitive" } } } } };
            }
        }
    }
    return undefined;
}

const buildProjectOrderBy = (sortBy: string | undefined, sortOrder: string): Record<string, unknown> =>
    buildOrderBy(PROJECT_SORT_FIELDS, sortBy, sortOrder, { createdAt: "desc" }, {
        taskCount: (order: string) => ({ issues: { _count: order } }),
        versionCount: (order: string) => ({ versions: { _count: order } }),
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
    const { filter, page = 1, perPage = 20, sortBy, sortOrder = "desc" } = request.query;

    const userId = Number(request.user.sub);
    const userRole = request.user.role;

    const where: Record<string, unknown> = {};
    if (userRole !== Role.ADMIN) {
        where.memberships = { some: { userId } };
    }

    const filterQueryParsed = parseFilterQuery(filter);

    const filterWhere = buildFilter(filterQueryParsed, [
        { field: "name", label: "Название", type: "text" },
        { field: "status", label: "Статус", type: "enum", enumValues: ["ACTIVE", "ARCHIVED"] },
        { field: "createdAt", label: "Дата создания", type: "date" },
    ]);

    // Handle responsible filter separately — it's a computed field from memberships
    const responsibleWhere = buildResponsibleFilter(filterQueryParsed);

    const additionalWheres = [filterWhere, responsibleWhere].filter(Boolean);
    const finalWhere = additionalWheres.length === 0
        ? where
        : { AND: [where, ...additionalWheres] };
    const { skip, take } = paginationArgs(page, perPage);

    const include = {
        _count: { select: { versions: true, issues: true } },
        memberships: { select: { role: true, user: { select: { login: true } } } },
        versions: { select: { id: true, version: true }, orderBy: { id: "desc" as const } },
    } as const;

    let projects;
    let total: number;
    let active: number;

    if (sortBy === "responsible") {
        // responsible — вычисляемое поле из memberships, сортируем в памяти
        const allProjects = await prisma.project.findMany({ where: finalWhere, include });
        total = allProjects.length;
        active = allProjects.filter(p => p.status === "ACTIVE").length;

        allProjects.sort((a, b) => {
            const cmp = findResponsible(a.memberships).localeCompare(findResponsible(b.memberships));
            return sortOrder === "asc" ? cmp : -cmp;
        });

        projects = allProjects.slice(skip, skip + take);
    } else {
        const orderBy = buildProjectOrderBy(sortBy, sortOrder);
        [projects, total, active] = await prisma.$transaction([
            prisma.project.findMany({ where: finalWhere, orderBy, skip, take, include }),
            prisma.project.count({ where: finalWhere }),
            prisma.project.count({ where: { ...finalWhere, status: "ACTIVE" } }),
        ]);
    }

    return {
        projects: projects.map(mapProject),
        total,
        active,
        page,
        perPage,
    };
};

export const getProjectsExportService = async (
    request: FastifyRequestTypeBox<typeof getProjectsExportSchema>
): Promise<{ projects: ProjectResponse[] }> => {
    const prisma = request.server.prisma;
    const { filter, sortBy, sortOrder = "desc" } = request.query;

    const userId = Number(request.user.sub);
    const userRole = request.user.role;

    const where: Record<string, unknown> = {};
    if (userRole !== Role.ADMIN) {
        where.memberships = { some: { userId } };
    }

    const filterQueryParsed = parseFilterQuery(filter);

    const filterWhere = buildFilter(filterQueryParsed, [
        { field: "name", label: "Название", type: "text" },
        { field: "status", label: "Статус", type: "enum", enumValues: ["ACTIVE", "ARCHIVED"] },
        { field: "createdAt", label: "Дата создания", type: "date" },
    ]);

    // Handle responsible filter separately — it's a computed field from memberships
    const responsibleWhere = buildResponsibleFilter(filterQueryParsed);

    const additionalWheres = [filterWhere, responsibleWhere].filter(Boolean);
    const finalWhere = additionalWheres.length === 0
        ? where
        : { AND: [where, ...additionalWheres] };

    const include = {
        _count: { select: { versions: true, issues: true } },
        memberships: { select: { role: true, user: { select: { login: true } } } },
        versions: { select: { id: true, version: true }, orderBy: { id: "desc" as const } },
    } as const;

    let projects;

    if (sortBy === "responsible") {
        projects = await prisma.project.findMany({ where: finalWhere, include });
        projects.sort((a, b) => {
            const cmp = findResponsible(a.memberships).localeCompare(findResponsible(b.memberships));
            return sortOrder === "asc" ? cmp : -cmp;
        });
    } else {
        const orderBy = buildProjectOrderBy(sortBy, sortOrder);
        projects = await prisma.project.findMany({ where: finalWhere, orderBy, include });
    }

    return { projects: projects.map(mapProject) };
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
        throw new AppError(HTTP_STATUS.NOT_FOUND, "Project not found", "PROJECT_NOT_FOUND");
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

    const existing = await prisma.project.findFirst({
        where: { name },
        select: { id: true },
    });
    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, "A project with this name already exists", "PROJECT_ALREADY_EXISTS");
    }

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

    auditLogEmitter.emitAuditLog(prisma, {
        eventType: "PROJECT_CREATED",
        subjectType: "USER",
        objectType: "PROJECT",
        subjectId: creatorId,
        objectId: project.id,
        newValue: JSON.stringify({ name: project.name, description }),
        subjectLogin: request.user.login,
        createdAt: new Date().toISOString(),
        projectId: project.id,
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
        throw new AppError(HTTP_STATUS.NOT_FOUND, "Project not found", "PROJECT_NOT_FOUND");
    }

    if (body.name !== undefined && body.name !== existing.name) {
        const duplicate = await prisma.project.findFirst({
            where: { name: body.name, id: { not: id } },
            select: { id: true },
        });
        if (duplicate) {
            throw new AppError(HTTP_STATUS.CONFLICT, "A project with this name already exists", "PROJECT_ALREADY_EXISTS");
        }
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
        throw new AppError(HTTP_STATUS.NOT_FOUND, "Project not found", "PROJECT_NOT_FOUND");
    }

    auditLogEmitter.emitAuditLog(prisma, {
        eventType: "PROJECT_UPDATED",
        subjectType: "USER",
        objectType: "PROJECT",
        subjectId: Number(request.user.sub),
        objectId: id,
        oldValue: JSON.stringify({ name: existing.name, status: existing.status }),
        newValue: JSON.stringify({ name: project.name, ...(body.name !== undefined ? { name: body.name } : {}), ...(body.status !== undefined ? { status: body.status } : {}) }),
        subjectLogin: request.user.login,
        createdAt: new Date().toISOString(),
        projectId: id,
    });

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
        throw new AppError(HTTP_STATUS.NOT_FOUND, "User not found", "USER_NOT_FOUND");
    }
    const existing = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId: id } },
    });
    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, "Member already exists", "MEMBER_ALREADY_EXISTS");
    }

    const member = await prisma.projectMember.create({
        data: { userId, projectId: id, role },
        select: { userId: true, role: true, user: { select: { login: true } } },
    });

    const project = await prisma.project.findUnique({ where: { id }, select: { name: true } });

    auditLogEmitter.emitAuditLog(prisma, {
        eventType: "MEMBER_ADDED",
        subjectType: "USER",
        objectType: "PROJECT",
        subjectId: Number(request.user.sub),
        objectId: id,
        newValue: JSON.stringify({ userId, role, login: member.user.login, projectName: project?.name }),
        subjectLogin: request.user.login,
        createdAt: new Date().toISOString(),
        projectId: id,
    });

    return { userId: member.userId, login: member.user.login, role: member.role };
};

export const updateProjectMemberService = async (
    request: FastifyRequestTypeBox<typeof updateProjectMemberSchema>
): Promise<MemberResponse> => {
    const prisma = request.server.prisma;
    const { id, userId } = request.params;
    const { role } = request.body;

    const { existing, member } = await prisma.$transaction(async tx => {
        const existing = await tx.projectMember.findUnique({
            where: { userId_projectId: { userId, projectId: id } },
        });
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, "Member not found", "MEMBER_NOT_FOUND");
        }

        if (existing.role === "MANAGER" && role !== "MANAGER") {
            await assertNotLastOfRole(
                tx.projectMember,
                { projectId: id, role: "MANAGER" },
                "LAST_MANAGER",
            );
        }

        const member = await tx.projectMember.update({
            where: { userId_projectId: { userId, projectId: id } },
            data: { role },
            select: { userId: true, role: true, user: { select: { login: true } } },
        });

        return { existing, member };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    const project = await prisma.project.findUnique({ where: { id }, select: { name: true } });

    auditLogEmitter.emitAuditLog(prisma, {
        eventType: "MEMBER_UPDATED",
        subjectType: "USER",
        objectType: "PROJECT",
        subjectId: Number(request.user.sub),
        objectId: id,
        oldValue: JSON.stringify({ userId, role: existing.role, login: member.user.login, projectName: project?.name }),
        newValue: JSON.stringify({ userId, role: member.role, login: member.user.login, projectName: project?.name }),
        subjectLogin: request.user.login,
        createdAt: new Date().toISOString(),
        projectId: id,
    });

    return { userId: member.userId, login: member.user.login, role: member.role };
};

export const deleteProjectService = async (
    request: FastifyRequestTypeBox<typeof deleteProjectSchema>
): Promise<null> => {
    const prisma = request.server.prisma;
    const { id } = request.params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, "Project not found", "PROJECT_NOT_FOUND");
    }

    await prisma.$transaction([
        prisma.productVersion.deleteMany({ where: { projectId: id } }),
        prisma.projectMember.deleteMany({ where: { projectId: id } }),
        prisma.issue.deleteMany({ where: { projectId: id } }),
        prisma.project.delete({ where: { id } }),
    ]);

    auditLogEmitter.emitAuditLog(prisma, {
        eventType: "PROJECT_DELETED",
        subjectType: "USER",
        objectType: "PROJECT",
        subjectId: Number(request.user.sub),
        objectId: id,
        oldValue: JSON.stringify({ name: existing.name }),
        subjectLogin: request.user.login,
        createdAt: new Date().toISOString(),
        projectId: id,
    });

    return null;
};

export const removeProjectMemberService = async (
    request: FastifyRequestTypeBox<typeof deleteProjectMemberSchema>
): Promise<null> => {
    const prisma = request.server.prisma;
    const { id, userId } = request.params;

    const existingMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId: id } },
        select: { role: true, user: { select: { login: true } } },
    });

    await prisma.$transaction(async tx => {
        const existing = await tx.projectMember.findUnique({
            where: { userId_projectId: { userId, projectId: id } },
        });
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, "Member not found", "MEMBER_NOT_FOUND");
        }

        if (existing.role === "MANAGER") {
            await assertNotLastOfRole(
                tx.projectMember,
                { projectId: id, role: "MANAGER" },
                "LAST_MANAGER",
            );
        }

        await tx.projectMember.delete({
            where: { userId_projectId: { userId, projectId: id } },
        });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (existingMember) {
        auditLogEmitter.emitAuditLog(prisma, {
            eventType: "MEMBER_REMOVED",
            subjectType: "USER",
            objectType: "PROJECT",
            subjectId: Number(request.user.sub),
            objectId: id,
            oldValue: JSON.stringify({ userId, role: existingMember.role, login: existingMember.user.login }),
            subjectLogin: request.user.login,
            createdAt: new Date().toISOString(),
            projectId: id,
        });
    }

    return null;
};
