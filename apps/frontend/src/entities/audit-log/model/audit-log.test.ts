import { describe, expectTypeOf, it } from "vitest";

import type { AuditLog, FetchAuditLogsParams } from "./audit-log";

describe("AuditLog model types", () => {
    it("AuditLog has correct shape", () => {
        const log: AuditLog = {
            id: 1,
            eventType: "UPDATE",
            subjectType: "USER",
            objectType: "ISSUE",
            subjectId: 1,
            objectId: 10,
            oldValue: '{"status":"NEW"}',
            newValue: '{"status":"CONFIRMED"}',
            subjectLogin: "admin",
            createdAt: "2026-01-01T00:00:00.000Z"
        };

        expectTypeOf(log.id).toBeNumber();
        expectTypeOf(log.eventType).toBeString();
        expectTypeOf(log.subjectType).toBeString();
        expectTypeOf(log.objectType).toBeString();
        expectTypeOf(log.subjectId).toBeNumber();
        expectTypeOf(log.objectId).toBeNumber();
        expectTypeOf(log.oldValue).toEqualTypeOf<string | null>();
        expectTypeOf(log.newValue).toEqualTypeOf<string | null>();
        expectTypeOf(log.subjectLogin).toBeString();
        expectTypeOf(log.createdAt).toBeString();
    });

    it("AuditLog supports null values for oldValue and newValue", () => {
        const log: AuditLog = {
            id: 1,
            eventType: "CREATE",
            subjectType: "USER",
            objectType: "PROJECT",
            subjectId: 1,
            objectId: 1,
            oldValue: null,
            newValue: null,
            subjectLogin: "admin",
            createdAt: "2026-01-01T00:00:00.000Z"
        };

        expect(log.oldValue).toBeNull();
        expect(log.newValue).toBeNull();
    });

    it("FetchAuditLogsParams has optional filter and pagination", () => {
        const params: FetchAuditLogsParams = { filter: "UPDATE", page: 1, perPage: 50 };
        expectTypeOf(params.filter).toEqualTypeOf<string | undefined>();
        expectTypeOf(params.page).toEqualTypeOf<number | undefined>();
        expectTypeOf(params.perPage).toEqualTypeOf<number | undefined>();
    });
});
