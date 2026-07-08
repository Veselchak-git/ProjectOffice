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
