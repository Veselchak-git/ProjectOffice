/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { AuditLogEventData, EntityChangeEvent } from "../emitter.js";
import { auditLogEmitter } from "../emitter.js";

const buildMockPrisma = (overrides: Record<string, unknown> = {}) => ({
    auditLog: {
        create: vi.fn().mockImplementation(async (args: { data: Record<string, unknown> }) => ({
            id: 1,
            ...args.data,
        })),
    },
    ...overrides,
});

const baseEventData: AuditLogEventData = {
    eventType: "CREATE",
    subjectType: "USER",
    objectType: "PROJECT",
    subjectId: 1,
    objectId: 10,
    oldValue: null,
    newValue: '{"name":"Project A"}',
    subjectLogin: "admin@example.com",
    createdAt: "2025-01-15T10:00:00.000Z",
    projectId: 5,
};

describe("auditLogEmitter", () => {
    beforeEach(() => {
        auditLogEmitter.removeAllListeners();
    });

    afterEach(() => {
        auditLogEmitter.removeAllListeners();
    });

    it("is a singleton extending EventEmitter", () => {
        expect(auditLogEmitter).toBeDefined();
        expect(typeof auditLogEmitter.on).toBe("function");
        expect(typeof auditLogEmitter.emit).toBe("function");
    });

    it("receives audit-log event when emitAuditLog is called", async () => {
        const listener = vi.fn();
        auditLogEmitter.on("audit-log", listener);

        const prisma = buildMockPrisma();
        await auditLogEmitter.emitAuditLog(prisma as never, baseEventData);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);

        const emitted = listener.mock.calls[0]![0] as Record<string, unknown>;
        expect(emitted.id).toBe(1);
        expect(emitted.eventType).toBe("CREATE");
        expect(emitted.subjectType).toBe("USER");
        expect(emitted.objectType).toBe("PROJECT");
        expect(emitted.subjectId).toBe(1);
        expect(emitted.objectId).toBe(10);
        expect(emitted.subjectLogin).toBe("admin@example.com");
    });

    it("persists audit log entry to database via prisma", async () => {
        const prisma = buildMockPrisma();
        await auditLogEmitter.emitAuditLog(prisma as never, baseEventData);

        expect(prisma.auditLog.create).toHaveBeenCalledWith({
            data: {
                eventType: "CREATE",
                subjectType: "USER",
                objectType: "PROJECT",
                subjectId: 1,
                objectId: 10,
                oldValue: null,
                newValue: '{"name":"Project A"}',
            },
        });
    });

    it("emits projects:change event for PROJECT objectType", async () => {
        const projectsListener = vi.fn();
        auditLogEmitter.on("projects:change", projectsListener);

        const prisma = buildMockPrisma();
        await auditLogEmitter.emitAuditLog(prisma as never, baseEventData);

        expect(projectsListener).toHaveBeenCalledTimes(1);
        const payload = projectsListener.mock.calls[0]![0] as EntityChangeEvent;
        expect(payload.entityType).toBe("PROJECT");
        expect(payload.action).toBe("CREATE");
        expect(payload.objectId).toBe(10);
        expect(payload.projectId).toBe(5);
    });

    it("emits users:change event for USER objectType", async () => {
        const usersListener = vi.fn();
        auditLogEmitter.on("users:change", usersListener);

        const eventData: AuditLogEventData = {
            ...baseEventData,
            objectType: "USER",
            projectId: undefined,
        };

        const prisma = buildMockPrisma();
        await auditLogEmitter.emitAuditLog(prisma as never, eventData);

        expect(usersListener).toHaveBeenCalledTimes(1);
        const payload = usersListener.mock.calls[0]![0] as EntityChangeEvent;
        expect(payload.entityType).toBe("USER");
        expect(payload.action).toBe("CREATE");
        expect(payload.objectId).toBe(10);
    });

    it("emits issues:change event for ISSUE objectType", async () => {
        const issuesListener = vi.fn();
        auditLogEmitter.on("issues:change", issuesListener);

        const eventData: AuditLogEventData = {
            ...baseEventData,
            objectType: "ISSUE",
        };

        const prisma = buildMockPrisma();
        await auditLogEmitter.emitAuditLog(prisma as never, eventData);

        expect(issuesListener).toHaveBeenCalledTimes(1);
        const payload = issuesListener.mock.calls[0]![0] as EntityChangeEvent;
        expect(payload.entityType).toBe("ISSUE");
        expect(payload.action).toBe("CREATE");
        expect(payload.objectId).toBe(10);
    });

    it("does not emit entity change events for unsupported objectType", async () => {
        const usersListener = vi.fn();
        const projectsListener = vi.fn();
        const issuesListener = vi.fn();

        auditLogEmitter.on("users:change", usersListener);
        auditLogEmitter.on("projects:change", projectsListener);
        auditLogEmitter.on("issues:change", issuesListener);

        const eventData: AuditLogEventData = {
            ...baseEventData,
            objectType: "UNKNOWN_TYPE",
        };

        const prisma = buildMockPrisma();
        await auditLogEmitter.emitAuditLog(prisma as never, eventData);

        expect(usersListener).not.toHaveBeenCalled();
        expect(projectsListener).not.toHaveBeenCalled();
        expect(issuesListener).not.toHaveBeenCalled();
    });

    it("notifies multiple listeners on the same event", async () => {
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        auditLogEmitter.on("audit-log", listener1);
        auditLogEmitter.on("audit-log", listener2);

        const prisma = buildMockPrisma();
        await auditLogEmitter.emitAuditLog(prisma as never, baseEventData);

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(1);
    });

    it("removeAllListeners stops all notifications", async () => {
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        auditLogEmitter.on("audit-log", listener1);
        auditLogEmitter.on("audit-log", listener2);

        auditLogEmitter.removeAllListeners();

        const prisma = buildMockPrisma();
        await auditLogEmitter.emitAuditLog(prisma as never, baseEventData);

        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).not.toHaveBeenCalled();
    });

    it("off removes only the specified listener", async () => {
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        auditLogEmitter.on("audit-log", listener1);
        auditLogEmitter.on("audit-log", listener2);

        auditLogEmitter.off("audit-log", listener1);

        const prisma = buildMockPrisma();
        await auditLogEmitter.emitAuditLog(prisma as never, baseEventData);

        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).toHaveBeenCalledTimes(1);
    });

    it("includes projectId in entity change event when provided", async () => {
        const projectsListener = vi.fn();
        auditLogEmitter.on("projects:change", projectsListener);

        const prisma = buildMockPrisma();
        await auditLogEmitter.emitAuditLog(prisma as never, { ...baseEventData, projectId: 42 });

        const payload = projectsListener.mock.calls[0]![0] as EntityChangeEvent;
        expect(payload.projectId).toBe(42);
    });

    it("omits projectId from entity change event when not provided", async () => {
        const projectsListener = vi.fn();
        auditLogEmitter.on("projects:change", projectsListener);

        const eventData: AuditLogEventData = { ...baseEventData, projectId: undefined };
        const prisma = buildMockPrisma();
        await auditLogEmitter.emitAuditLog(prisma as never, eventData);

        const payload = projectsListener.mock.calls[0]![0] as EntityChangeEvent;
        expect(payload.projectId).toBeUndefined();
    });
});
