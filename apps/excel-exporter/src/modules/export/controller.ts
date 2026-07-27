/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import {
    exportProjectsSchema,
    exportIssuesSchema,
    exportUsersSchema,
    exportAuditLogSchema,
} from "./schema.js";
import {
    fetchAndGenerateExport,
    fetchAndGenerateIssueExport,
    fetchAndGenerateUsersExport,
    fetchAndGenerateAuditLogExport,
} from "./service.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post(
        "/api/export/projects",
        {
            schema: { body: exportProjectsSchema.body },
        },
        async (request, reply) => {
            const authHeader = request.headers.authorization;
            const jwt = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
            const backendUrl = fastify.config.BACKEND_URL;

            const buffer = await fetchAndGenerateExport(request.body, backendUrl, jwt);

            const dateStr = new Date().toISOString().slice(0, 10);
            const asciiFilename = `projects_${dateStr}.xlsx`;
            const displayFilename = request.body.locale === "ru"
                ? `Проекты_${dateStr}.xlsx`
                : asciiFilename;

            await reply
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .header("Content-Disposition", `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(displayFilename)}`)
                .send(buffer);
        },
    );

    fastify.post(
        "/api/export/issues",
        {
            schema: { body: exportIssuesSchema.body },
        },
        async (request, reply) => {
            const authHeader = request.headers.authorization;
            const jwt = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
            const backendUrl = fastify.config.BACKEND_URL;

            const buffer = await fetchAndGenerateIssueExport(request.body, backendUrl, jwt);

            const dateStr = new Date().toISOString().slice(0, 10);
            const asciiFilename = `issues_${dateStr}.xlsx`;
            const displayFilename = request.body.locale === "ru"
                ? `Задачи_${dateStr}.xlsx`
                : asciiFilename;

            await reply
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .header("Content-Disposition", `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(displayFilename)}`)
                .send(buffer);
        },
    );

    fastify.post(
        "/api/export/users",
        {
            schema: { body: exportUsersSchema.body },
        },
        async (request, reply) => {
            const authHeader = request.headers.authorization;
            const jwt = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
            const backendUrl = fastify.config.BACKEND_URL;

            const buffer = await fetchAndGenerateUsersExport(request.body, backendUrl, jwt);

            const dateStr = new Date().toISOString().slice(0, 10);
            const asciiFilename = `users_${dateStr}.xlsx`;
            const displayFilename = request.body.locale === "ru"
                ? `Пользователи_${dateStr}.xlsx`
                : asciiFilename;

            await reply
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .header("Content-Disposition", `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(displayFilename)}`)
                .send(buffer);
        },
    );

    fastify.post(
        "/api/export/audit-log",
        {
            schema: { body: exportAuditLogSchema.body },
        },
        async (request, reply) => {
            const authHeader = request.headers.authorization;
            const jwt = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
            const backendUrl = fastify.config.BACKEND_URL;

            const buffer = await fetchAndGenerateAuditLogExport(request.body, backendUrl, jwt);

            const dateStr = new Date().toISOString().slice(0, 10);
            const asciiFilename = `audit_log_${dateStr}.xlsx`;
            const displayFilename = request.body.locale === "ru"
                ? `Журнал_аудита_${dateStr}.xlsx`
                : asciiFilename;

            await reply
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .header("Content-Disposition", `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(displayFilename)}`)
                .send(buffer);
        },
    );
};

export const exportController = fp(plugin, {
    name: "export-controller",
});
