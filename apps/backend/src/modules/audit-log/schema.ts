import { type Static, Type } from "@fastify/type-provider-typebox";

import { createPaginationQueryFields } from "@/schemas/pagination-query/index.js";

export const auditLogAvailableResponseSchema = Type.Object({
    available: Type.Boolean(),
});

export type AuditLogAvailableResponse = Static<typeof auditLogAvailableResponseSchema>;

export const getAuditLogAvailableSchema = {
    response: {
        200: auditLogAvailableResponseSchema,
    },
};

// Audit log list response item
export const auditLogItemSchema = Type.Object({
    id: Type.Number(),
    eventType: Type.String(),
    subjectType: Type.String(),
    objectType: Type.String(),
    subjectId: Type.Number(),
    objectId: Type.Number(),
    oldValue: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    newValue: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    subjectLogin: Type.String(),
    createdAt: Type.String(),
});

export type AuditLogItem = Static<typeof auditLogItemSchema>;

// Audit log list response
export const auditLogListResponseSchema = Type.Object({
    logs: Type.Array(auditLogItemSchema),
    total: Type.Number(),
    page: Type.Number(),
    perPage: Type.Number(),
});

export type AuditLogListResponse = Static<typeof auditLogListResponseSchema>;

// Audit log list query (uses pagination)
export const auditLogListQuerySchema = Type.Object({
    ...createPaginationQueryFields({
        sortBy: "createdAt",
        sortOrder: "desc",
    }),
});

export type AuditLogListQuery = Static<typeof auditLogListQuerySchema>;

// Full schema for GET /audit-log
export const getAuditLogListSchema = {
    querystring: auditLogListQuerySchema,
    response: {
        200: auditLogListResponseSchema,
    },
};

// SSE event schema (for documentation, actual SSE is text/event-stream)
export const auditLogSseEventSchema = Type.Object({
    id: Type.Number(),
    eventType: Type.String(),
    subjectType: Type.String(),
    objectType: Type.String(),
    subjectId: Type.Number(),
    objectId: Type.Number(),
    oldValue: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    newValue: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    subjectLogin: Type.String(),
    createdAt: Type.String(),
});

export type AuditLogSseEvent = Static<typeof auditLogSseEventSchema>;

// SSE stream query (token via query param for EventSource)
export const auditLogStreamQuerySchema = Type.Object({
    token: Type.String(),
});

// SSE stream endpoint schema
export const getAuditLogStreamSchema = {
    querystring: auditLogStreamQuerySchema,
    response: {
        200: Type.String(),
    },
};
