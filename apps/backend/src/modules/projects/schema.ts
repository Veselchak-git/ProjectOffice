/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 * 
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

import { type Static, Type } from "@fastify/type-provider-typebox";

import { createPaginationQueryFields } from "@/schemas/pagination-query/index.js";

const versionSchema = Type.Object({
    id: Type.Number(),
    version: Type.String(),
});

const projectMemberRoleSchema = Type.Union([
    Type.Literal("VIEWER"),
    Type.Literal("REPORTER"),
    Type.Literal("UPDATER"),
    Type.Literal("DEVELOPER"),
    Type.Literal("MANAGER"),
]);

export const projectResponseSchema = Type.Object({
    id: Type.Number(),
    name: Type.String(),
    description: Type.Union([Type.String(), Type.Null()]),
    status: Type.Union([Type.Literal("ACTIVE"), Type.Literal("ARCHIVED")]),
    versionCount: Type.Number(),
    versions: Type.Array(versionSchema),
    taskCount: Type.Number(),
    responsible: Type.String(),
    createdAt: Type.String(),
});

export type ProjectResponse = Static<typeof projectResponseSchema>;

export const projectListResponseSchema = Type.Object({
    projects: Type.Array(projectResponseSchema),
    total: Type.Number(),
    active: Type.Number(),
    page: Type.Number(),
    perPage: Type.Number(),
});

export type ProjectListResponse = Static<typeof projectListResponseSchema>;

export const getProjectsListQuerySchema = Type.Object({
    ...createPaginationQueryFields({
        sortBy: "createdAt",
        sortOrder: "desc",
    }),
    filter: Type.Optional(Type.String()),
});

export type GetProjectsListQuery = Static<typeof getProjectsListQuerySchema>;

export const getProjectsListSchema = {
    querystring: getProjectsListQuerySchema,
    response: {
        200: projectListResponseSchema,
    },
};

export const getProjectsExportQuerySchema = Type.Object({
    filter: Type.Optional(Type.String()),
    sortBy: Type.Optional(Type.String()),
    sortOrder: Type.Optional(Type.Union([Type.Literal("asc"), Type.Literal("desc")])),
});

export type GetProjectsExportQuery = Static<typeof getProjectsExportQuerySchema>;

export const projectExportResponseSchema = Type.Object({
    projects: Type.Array(projectResponseSchema),
});

export const getProjectsExportSchema = {
    querystring: getProjectsExportQuerySchema,
    response: {
        200: projectExportResponseSchema,
    },
};

const projectDetailResponseSchema = Type.Object({
    id: Type.Number(),
    name: Type.String(),
    description: Type.Union([Type.String(), Type.Null()]),
    status: Type.Union([Type.Literal("ACTIVE"), Type.Literal("ARCHIVED")]),
    versionCount: Type.Number(),
    versions: Type.Array(versionSchema),
    taskCount: Type.Number(),
    responsible: Type.String(),
    createdAt: Type.String(),
    myRole: Type.Optional(Type.String()),
});

export type ProjectDetailResponse = Static<typeof projectDetailResponseSchema>;

export const getProjectByIdSchema = {
    params: Type.Object({
        id: Type.Number(),
    }),
    response: {
        200: projectDetailResponseSchema,
    },
};

export const memberResponseSchema = Type.Object({
    userId: Type.Number(),
    login: Type.String(),
    role: projectMemberRoleSchema,
});

export type MemberResponse = Static<typeof memberResponseSchema>;

export const getProjectMembersSchema = {
    params: Type.Object({
        id: Type.Number(),
    }),
    response: {
        200: Type.Array(memberResponseSchema),
    },
};

export const addMemberBodySchema = Type.Object({
    userId: Type.Number(),
    role: projectMemberRoleSchema,
});

export type AddMemberBody = Static<typeof addMemberBodySchema>;

export const addProjectMemberSchema = {
    params: Type.Object({
        id: Type.Number(),
    }),
    body: addMemberBodySchema,
    response: {
        201: memberResponseSchema,
    },
};

export const updateMemberRoleBodySchema = Type.Object({
    role: projectMemberRoleSchema,
});

export type UpdateMemberRoleBody = Static<typeof updateMemberRoleBodySchema>;

export const updateProjectMemberSchema = {
    params: Type.Object({
        id: Type.Number(),
        userId: Type.Number(),
    }),
    body: updateMemberRoleBodySchema,
    response: {
        200: memberResponseSchema,
    },
};

export const deleteProjectMemberSchema = {
    params: Type.Object({
        id: Type.Number(),
        userId: Type.Number(),
    }),
    response: {
        204: Type.Null(),
    },
};

export const deleteProjectSchema = {
    params: Type.Object({
        id: Type.Number(),
    }),
    response: {
        204: Type.Null(),
    },
};

export const createProjectBodySchema = Type.Object({
    name: Type.String({ minLength: 1 }),
    description: Type.Optional(Type.String()),
    versions: Type.Array(Type.String()),
});

export type CreateProjectBody = Static<typeof createProjectBodySchema>;

const createProjectResponseSchema = Type.Object({
    id: Type.Number(),
    name: Type.String(),
});

export const createProjectSchema = {
    body: createProjectBodySchema,
    response: {
        200: createProjectResponseSchema,
    },
};

export const updateProjectBodySchema = Type.Object({
    name: Type.Optional(Type.String({ minLength: 1 })),
    description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    status: Type.Optional(Type.Union([Type.Literal("ACTIVE"), Type.Literal("ARCHIVED")])),
    versions: Type.Optional(Type.Array(Type.String())),
});

export type UpdateProjectBody = Static<typeof updateProjectBodySchema>;

const updateProjectResponseSchema = Type.Object({
    id: Type.Number(),
    name: Type.String(),
});

export const updateProjectSchema = {
    params: Type.Object({
        id: Type.Number(),
    }),
    body: updateProjectBodySchema,
    response: {
        200: updateProjectResponseSchema,
    },
};
