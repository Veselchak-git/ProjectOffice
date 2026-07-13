import { type Static, Type } from "@fastify/type-provider-typebox";

export const auditLogAvailableResponseSchema = Type.Object({
    available: Type.Boolean(),
});

export type AuditLogAvailableResponse = Static<typeof auditLogAvailableResponseSchema>;

export const getAuditLogAvailableSchema = {
    response: {
        200: auditLogAvailableResponseSchema,
    },
};
