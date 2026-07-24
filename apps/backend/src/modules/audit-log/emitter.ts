/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

import type { PrismaClient } from "@/generated/prisma/client.js";
import { EventEmitter } from "events";

export interface AuditLogEventData {
    eventType: string;
    subjectType: string;
    objectType: string;
    subjectId: number;
    objectId: number;
    oldValue?: string | null;
    newValue?: string | null;
    subjectLogin: string;
    createdAt: string;
    projectId?: number;
}

export interface EntityChangeEvent {
    entityType: string;
    action: string;
    objectId: number;
    projectId?: number;
}

class AuditLogEmitter extends EventEmitter {
    private static instance: AuditLogEmitter;

    private constructor() {
        super();
        // Увеличиваем лимит: до 500 SSE-соединений × 4 события = 2000 listener'ов
        this.setMaxListeners(500);
    }

    static getInstance(): AuditLogEmitter {
        if (!AuditLogEmitter.instance) {
            AuditLogEmitter.instance = new AuditLogEmitter();
        }
        return AuditLogEmitter.instance;
    }

    /**
     * Persists the audit log entry to the database AND broadcasts via EventEmitter.
     * The persisted record is what the GET /audit-log endpoint reads.
     * The EventEmitter broadcast is what the SSE /audit-log/stream endpoint relays to clients.
     */
    async emitAuditLog(prisma: PrismaClient, data: AuditLogEventData): Promise<void> {
        const record = await prisma.auditLog.create({
            data: {
                eventType: data.eventType,
                subjectType: data.subjectType,
                objectType: data.objectType,
                subjectId: data.subjectId,
                objectId: data.objectId,
                oldValue: data.oldValue ?? null,
                newValue: data.newValue ?? null,
            },
        });

        this.emit("audit-log", {
            id: record.id,
            ...data,
        });

        const entityEventMap: Record<string, string> = {
            USER: "users:change",
            PROJECT: "projects:change",
            ISSUE: "issues:change",
        };

        const entityEvent = entityEventMap[data.objectType];
        if (entityEvent) {
            const eventPayload: EntityChangeEvent = {
                entityType: data.objectType,
                action: data.eventType,
                objectId: data.objectId,
            };
            if (data.projectId !== undefined) {
                eventPayload.projectId = data.projectId;
            }
            this.emit(entityEvent, eventPayload);
        }
    }
}

export const auditLogEmitter = AuditLogEmitter.getInstance();