import { type Static, Type } from "@fastify/type-provider-typebox";

export const projectResponseSchema = Type.Object({
    id: Type.Number(),
    name: Type.String(),
    description: Type.Union([Type.String(), Type.Null()]),
    status: Type.Union([Type.Literal("ACTIVE"), Type.Literal("ARCHIVED")]),
    versionCount: Type.Number(),
    taskCount: Type.Number(),
    responsible: Type.String(),
    createdAt: Type.String(),
});

export type ProjectResponse = Static<typeof projectResponseSchema>;

export const projectListResponseSchema = Type.Object({
    projects: Type.Array(projectResponseSchema),
    total: Type.Number(),
    active: Type.Number(),
});

export type ProjectListResponse = Static<typeof projectListResponseSchema>;

export const getProjectsListSchema = {
    response: {
        200: projectListResponseSchema,
    },
};

const projectDetailResponseSchema = Type.Object({
    id: Type.Number(),
    name: Type.String(),
    description: Type.Union([Type.String(), Type.Null()]),
    status: Type.Union([Type.Literal("ACTIVE"), Type.Literal("ARCHIVED")]),
    versionCount: Type.Number(),
    versions: Type.Array(Type.String()),
    taskCount: Type.Number(),
    responsible: Type.String(),
    createdAt: Type.String(),
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
