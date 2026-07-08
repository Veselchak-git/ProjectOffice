import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";

import type {
    ProjectListResponse,
    ProjectDetailResponse,
    CreateProjectBody,
    UpdateProjectBody,
} from "./schema.js";

import {
    getProjectsListSchema,
    getProjectByIdSchema,
    createProjectSchema,
    updateProjectSchema,
} from "./schema.js";

const mapProject = (p: {
    id: number;
    name: string;
    description: string | null;
    status: string;
    createdAt: Date;
    _count: { versions: number; issues: number };
    memberships: { user: { login: string } }[];
}) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status as "ACTIVE" | "ARCHIVED",
    versionCount: p._count.versions,
    taskCount: p._count.issues,
    responsible: p.memberships[0]?.user.login ?? "",
    createdAt: p.createdAt.toISOString(),
});

export const getProjectsListService = async (
    request: FastifyRequestTypeBox<typeof getProjectsListSchema>
): Promise<ProjectListResponse> => {
    const prisma = request.server.prisma;

    const projects = await prisma.project.findMany({
        include: {
            _count: { select: { versions: true, issues: true } },
            memberships: { include: { user: { select: { login: true } } } },
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
            memberships: { include: { user: { select: { login: true } } } },
            versions: { select: { version: true } },
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
        responsible: project.memberships[0]?.user.login ?? "",
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
