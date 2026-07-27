import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearFilterState, loadFilterState, saveFilterState } from "./filter-storage";

describe("filter-storage", () => {
    const testKey = "test-table";

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("saveFilterState → loadFilterState возвращает то же состояние", () => {
        const state = {
            groups: [
                {
                    logic: "AND" as const,
                    conditions: [{ id: "c1", field: "name", operator: "eq" as const, value: "test" }]
                }
            ],
            fieldConfigs: [{ field: "name", label: "Name", type: "text" as const }]
        };

        saveFilterState(testKey, state);
        const result = loadFilterState(testKey);

        expect(result).toEqual(state);
    });

    it("loadFilterState несуществующего ключа → null", () => {
        const result = loadFilterState("nonexistent-key");

        expect(result).toBeNull();
    });

    it("clearFilterState → loadFilterState возвращает null", () => {
        const state = {
            groups: [],
            fieldConfigs: []
        };

        saveFilterState(testKey, state);
        clearFilterState(testKey);
        const result = loadFilterState(testKey);

        expect(result).toBeNull();
    });

    it("Невалидный JSON в localStorage → null", () => {
        localStorage.setItem("app-filter-" + testKey, "not-valid-json");

        const result = loadFilterState(testKey);

        expect(result).toBeNull();
    });

    it("Пустая строка в localStorage → null", () => {
        localStorage.setItem("app-filter-" + testKey, "");

        const result = loadFilterState(testKey);

        expect(result).toBeNull();
    });
});
