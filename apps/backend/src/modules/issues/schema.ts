import { type Static, Type } from "@fastify/type-provider-typebox";

export const issueResponseSchema = Type.Object({
    id: Type.Number(),
    title: Type.String(),
    projectId: Type.Number(),
    projectName: Type.String(),
    category: Type.String(),
    priority: Type.String(),
    reproducibility: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    productVersionId: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
    productVersion: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    additionalInfo: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    status: Type.String(),
    assigneeId: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
    assigneeLogin: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    reporterId: Type.Number(),
    reporterLogin: Type.String(),
    solution: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    myRole: Type.Optional(Type.String()),
    createdAt: Type.String(),
    updatedAt: Type.String(),
});

export type IssueResponse = Static<typeof issueResponseSchema>;

export const issueListResponseSchema = Type.Object({
    issues: Type.Array(issueResponseSchema),
    total: Type.Number(),
    page: Type.Number(),
    perPage: Type.Number(),
});

export type IssueListResponse = Static<typeof issueListResponseSchema>;

export const issuesListQuerySchema = Type.Object({
    q: Type.Optional(Type.String()),
    page: Type.Optional(Type.Number({ default: 1 })),
    perPage: Type.Optional(Type.Number({ default: 20 })),
    sortBy: Type.Optional(Type.String({ default: "createdAt" })),
    sortOrder: Type.Optional(Type.String({ default: "desc" })),
    status: Type.Optional(Type.String()),
    priority: Type.Optional(Type.String()),
    category: Type.Optional(Type.String()),
});

export type IssuesListQuery = Static<typeof issuesListQuerySchema>;

export const getIssuesListSchema = {
    querystring: issuesListQuerySchema,
    response: {
        200: issueListResponseSchema,
    },
};

export const getProjectIssuesSchema = {
    params: Type.Object({
        id: Type.Number(),
    }),
    querystring: issuesListQuerySchema,
    response: {
        200: issueListResponseSchema,
    },
};

export const getIssueByIdSchema = {
    params: Type.Object({
        id: Type.Number(),
    }),
    response: {
        200: issueResponseSchema,
    },
};

export const createIssueBodySchema = Type.Object({
    title: Type.String({ minLength: 1 }),
    category: Type.String(),
    priority: Type.String(),
    reproducibility: Type.Optional(Type.String()),
    productVersionId: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
    description: Type.Optional(Type.String()),
    additionalInfo: Type.Optional(Type.String()),
    assigneeId: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
});

export type CreateIssueBody = Static<typeof createIssueBodySchema>;

export const createIssueSchema = {
    params: Type.Object({
        id: Type.Number(),
    }),
    body: createIssueBodySchema,
    response: {
        201: issueResponseSchema,
    },
};

export const updateIssueBodySchema = Type.Object({
    title: Type.Optional(Type.String({ minLength: 1 })),
    category: Type.Optional(Type.String()),
    priority: Type.Optional(Type.String()),
    reproducibility: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    productVersionId: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
    description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    additionalInfo: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    status: Type.Optional(Type.String()),
    assigneeId: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
    solution: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export type UpdateIssueBody = Static<typeof updateIssueBodySchema>;

export const updateIssueSchema = {
    params: Type.Object({
        id: Type.Number(),
    }),
    body: updateIssueBodySchema,
    response: {
        200: issueResponseSchema,
    },
};

export const deleteIssueSchema = {
    params: Type.Object({
        id: Type.Number(),
    }),
    response: {
        204: Type.Null(),
    },
};
