/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Type, type Static } from "@fastify/type-provider-typebox";

export const exportProjectsSchema = {
    body: Type.Object({
        applyFilters: Type.Optional(Type.Boolean({ default: false })),
        applySorting: Type.Optional(Type.Boolean({ default: false })),
        locale: Type.Optional(Type.String({ default: "ru" })),
        timezone: Type.Optional(Type.String({ default: "UTC" })),
        columnHeaders: Type.Optional(Type.Record(Type.String(), Type.String())),
        filter: Type.Optional(Type.String()),
        sortBy: Type.Optional(Type.String()),
        sortOrder: Type.Optional(Type.Union([Type.Literal("asc"), Type.Literal("desc")])),
        jwt: Type.Optional(Type.String()),
    }),
};

export type ExportProjectsBody = Static<typeof exportProjectsSchema.body>;

export const exportIssuesSchema = {
    body: Type.Object({
        applyFilters: Type.Optional(Type.Boolean({ default: false })),
        applySorting: Type.Optional(Type.Boolean({ default: false })),
        locale: Type.Optional(Type.String({ default: "ru" })),
        timezone: Type.Optional(Type.String({ default: "UTC" })),
        columnHeaders: Type.Optional(Type.Record(Type.String(), Type.String())),
        filter: Type.Optional(Type.String()),
        sortBy: Type.Optional(Type.String()),
        sortOrder: Type.Optional(Type.Union([Type.Literal("asc"), Type.Literal("desc")])),
        jwt: Type.Optional(Type.String()),
    }),
};
export type ExportIssuesBody = Static<typeof exportIssuesSchema.body>;

export const exportUsersSchema = {
    body: Type.Object({
        applyFilters: Type.Optional(Type.Boolean({ default: false })),
        applySorting: Type.Optional(Type.Boolean({ default: false })),
        locale: Type.Optional(Type.String({ default: "ru" })),
        timezone: Type.Optional(Type.String({ default: "UTC" })),
        columnHeaders: Type.Optional(Type.Record(Type.String(), Type.String())),
        filter: Type.Optional(Type.String()),
        sortBy: Type.Optional(Type.String()),
        sortOrder: Type.Optional(Type.Union([Type.Literal("asc"), Type.Literal("desc")])),
        jwt: Type.Optional(Type.String()),
    }),
};
export type ExportUsersBody = Static<typeof exportUsersSchema.body>;

export const exportAuditLogSchema = {
    body: Type.Object({
        applyFilters: Type.Optional(Type.Boolean({ default: false })),
        applySorting: Type.Optional(Type.Boolean({ default: false })),
        locale: Type.Optional(Type.String({ default: "ru" })),
        timezone: Type.Optional(Type.String({ default: "UTC" })),
        columnHeaders: Type.Optional(Type.Record(Type.String(), Type.String())),
        filter: Type.Optional(Type.String()),
        sortBy: Type.Optional(Type.String()),
        sortOrder: Type.Optional(Type.Union([Type.Literal("asc"), Type.Literal("desc")])),
        jwt: Type.Optional(Type.String()),
    }),
};
export type ExportAuditLogBody = Static<typeof exportAuditLogSchema.body>;
