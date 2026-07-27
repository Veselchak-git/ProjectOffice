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
    filter: Type.Optional(Type.String()),
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

// SSE stream query (empty - authentication via Authorization header)
export const auditLogStreamQuerySchema = Type.Object({});

// SSE stream endpoint schema
export const getAuditLogStreamSchema = {
    querystring: auditLogStreamQuerySchema,
    response: {
        200: Type.String(),
    },
};

// Audit log export query
export const getAuditLogExportQuerySchema = Type.Object({
    filter: Type.Optional(Type.String()),
    sortBy: Type.Optional(Type.String()),
    sortOrder: Type.Optional(Type.Union([Type.Literal("asc"), Type.Literal("desc")])),
});
export type GetAuditLogExportQuery = Static<typeof getAuditLogExportQuerySchema>;

// Audit log export response (no pagination - returns all matching logs)
export const auditLogExportResponseSchema = Type.Object({
    logs: Type.Array(auditLogItemSchema),
});
export type AuditLogExportResponse = Static<typeof auditLogExportResponseSchema>;

// Full schema for GET /audit-log/export
export const getAuditLogExportSchema = {
    querystring: getAuditLogExportQuerySchema,
    response: { 200: auditLogExportResponseSchema },
};
