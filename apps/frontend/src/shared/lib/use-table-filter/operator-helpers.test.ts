import { describe, expect, it } from "vitest";

import { formatFilterChipLabel, getOperatorsForFieldType, getValueInputType } from "./operator-helpers";

describe("getOperatorsForFieldType", () => {
    it("enum → 2 оператора (in, not_in)", () => {
        const result = getOperatorsForFieldType("enum");
        expect(result).toHaveLength(2);
        expect(result.map(o => o.value)).toEqual(["in", "not_in"]);
    });

    it("text → 4 оператора (contains, not_contains, starts_with, eq)", () => {
        const result = getOperatorsForFieldType("text");
        expect(result).toHaveLength(4);
        expect(result.map(o => o.value)).toEqual(["contains", "not_contains", "starts_with", "eq"]);
    });

    it("date → 2 оператора (after, before)", () => {
        const result = getOperatorsForFieldType("date");
        expect(result).toHaveLength(2);
        expect(result.map(o => o.value)).toEqual(["after", "before"]);
    });
});

describe("getValueInputType", () => {
    it("'in' → 'multiselect'", () => {
        expect(getValueInputType("in")).toBe("multiselect");
    });

    it("'not_in' → 'multiselect'", () => {
        expect(getValueInputType("not_in")).toBe("multiselect");
    });

    it("'after' → 'date'", () => {
        expect(getValueInputType("after")).toBe("date");
    });

    it("'before' → 'date'", () => {
        expect(getValueInputType("before")).toBe("date");
    });

    it("'eq' → 'text'", () => {
        expect(getValueInputType("eq")).toBe("text");
    });

    it("'contains' → 'text'", () => {
        expect(getValueInputType("contains")).toBe("text");
    });
});

describe("formatFilterChipLabel", () => {
    it('enum значение → "Статус: Активный"', () => {
        const condition = { id: "1", field: "status", operator: "eq" as const, value: "active" };
        const fieldConfig = {
            field: "status",
            label: "Статус",
            type: "enum" as const,
            enumValues: [{ value: "active", label: "Активный" }]
        };
        expect(formatFilterChipLabel(condition, fieldConfig)).toBe("Статус: Активный");
    });

    it('текст → "Название: Test"', () => {
        const condition = { id: "1", field: "name", operator: "contains" as const, value: "Test" };
        const fieldConfig = { field: "name", label: "Название", type: "text" as const };
        expect(formatFilterChipLabel(condition, fieldConfig)).toBe("Название: Test");
    });

    it('массив enum → "Статус: Активный, Закрытый"', () => {
        const condition = { id: "1", field: "status", operator: "in" as const, value: ["active", "closed"] };
        const fieldConfig = {
            field: "status",
            label: "Статус",
            type: "enum" as const,
            enumValues: [
                { value: "active", label: "Активный" },
                { value: "closed", label: "Закрытый" }
            ]
        };
        expect(formatFilterChipLabel(condition, fieldConfig)).toBe("Статус: Активный, Закрытый");
    });
});
