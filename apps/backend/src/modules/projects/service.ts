import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";

import type { ProjectListResponse, getProjectsListSchema } from "./schema.js";

export const getProjectsListService = async (
    request: FastifyRequestTypeBox<typeof getProjectsListSchema>
): Promise<ProjectListResponse> => {
    const prisma = request.server.prisma;

    const projects = await prisma.project.findMany({
        include: {
            _count: {
                select: {
                    versions: true,
                    issues: true,
                },
            },
            memberships: {
                include: {
                    user: {
                        select: {
                            login: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const mapped = projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status as "ACTIVE" | "ARCHIVED",
        versionCount: p._count.versions,
        taskCount: p._count.issues,
        responsible: p.memberships[0]?.user.login ?? "",
        createdAt: p.createdAt.toISOString(),
    }));

    return {
        projects: mapped,
        total: mapped.length,
        active: mapped.filter(p => p.status === "ACTIVE").length,
    };
};
