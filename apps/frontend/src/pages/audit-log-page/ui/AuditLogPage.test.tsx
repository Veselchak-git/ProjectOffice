/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved.
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auditLogPageSlice } from "../model/audit-log-page-slice";
import { ALL_COLUMNS, DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } from "../model/columns";

// ── Тесты колонок ─────────────────────────────────────────────────────────

describe("audit-log-page columns", () => {
    it("defines all expected columns", () => {
        const ids = ALL_COLUMNS.map(c => c.id);

        expect(ids).toContain("eventType");
        expect(ids).toContain("subjectType");
        expect(ids).toContain("objectType");
        expect(ids).toContain("subjectId");
        expect(ids).toContain("objectId");
        expect(ids).toContain("createdAt");
    });

    it("has select in default column order", () => {
        expect(DEFAULT_COLUMN_ORDER[0]).toBe("select");
    });

    it("all columns are visible by default", () => {
        for (const col of ALL_COLUMNS) {
            expect(DEFAULT_COLUMN_VISIBILITY[col.id]).toBe(true);
        }
    });
});

// ── Тесты слайса ──────────────────────────────────────────────────────────

describe("auditLogPageSlice", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("has correct reducer name", () => {
        expect(auditLogPageSlice.name).toBe("auditLogPage");
    });

    it("setColumnOrder action updates column order", () => {
        const state = auditLogPageSlice.reducer(undefined, { type: "@@INIT" });
        const newOrder = ["createdAt", "eventType", "select"];
        const updated = auditLogPageSlice.reducer(state, auditLogPageSlice.actions.setColumnOrder(newOrder));

        expect(updated.columnOrder).toEqual(newOrder);
    });

    it("setColumnVisibility action toggles column visibility", () => {
        const state = auditLogPageSlice.reducer(undefined, { type: "@@INIT" });
        const updated = auditLogPageSlice.reducer(
            state,
            auditLogPageSlice.actions.setColumnVisibility({ eventType: false })
        );

        expect(updated.columnVisibility.eventType).toBe(false);
    });

    it("setRowSelection action updates row selection", () => {
        const state = auditLogPageSlice.reducer(undefined, { type: "@@INIT" });
        const updated = auditLogPageSlice.reducer(state, auditLogPageSlice.actions.setRowSelection({ "1": true }));

        expect(updated.rowSelection).toEqual({ "1": true });
    });
});
