/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { describe, expect, it } from "vitest";

import { parseFilterQuery } from "./filter-schema.js";

describe("parseFilterQuery", () => {
    it("valid JSON → FilterGroup", () => {
        const result = parseFilterQuery(
            JSON.stringify({
                logic: "AND",
                conditions: [
                    { field: "status", operator: "eq", value: "open" },
                ],
            }),
        );

        expect(result).toBeDefined();
        expect(result?.logic).toBe("AND");
        expect(result?.conditions).toHaveLength(1);
        expect(result?.conditions[0]).toEqual({
            field: "status",
            operator: "eq",
            value: "open",
        });
    });

    it("empty string → undefined", () => {
        expect(parseFilterQuery("")).toBeUndefined();
    });

    it("whitespace-only string → undefined", () => {
        expect(parseFilterQuery("   ")).toBeUndefined();
    });

    it("undefined → undefined", () => {
        expect(parseFilterQuery(undefined)).toBeUndefined();
    });

    it("invalid JSON → undefined", () => {
        expect(parseFilterQuery("not json")).toBeUndefined();
    });

    it("invalid operator → undefined", () => {
        expect(
            parseFilterQuery(
                JSON.stringify({
                    logic: "AND",
                    conditions: [
                        { field: "status", operator: "invalid_op", value: "open" },
                    ],
                }),
            ),
        ).toBeUndefined();
    });

    it("invalid logic → undefined", () => {
        expect(
            parseFilterQuery(
                JSON.stringify({
                    logic: "XOR",
                    conditions: [
                        { field: "status", operator: "eq", value: "open" },
                    ],
                }),
            ),
        ).toBeUndefined();
    });

    it("empty conditions → undefined", () => {
        expect(
            parseFilterQuery(
                JSON.stringify({
                    logic: "AND",
                    conditions: [],
                }),
            ),
        ).toBeUndefined();
    });

    it("missing conditions → undefined", () => {
        expect(
            parseFilterQuery(
                JSON.stringify({
                    logic: "AND",
                }),
            ),
        ).toBeUndefined();
    });

    it("valid JSON with in operator (array value) → FilterGroup", () => {
        const result = parseFilterQuery(
            JSON.stringify({
                logic: "OR",
                conditions: [
                    { field: "status", operator: "in", value: ["open", "pending"] },
                ],
            }),
        );

        expect(result).toBeDefined();
        expect(result!.logic).toBe("OR");
        expect(result!.conditions[0]!.operator).toBe("in");
        expect(result!.conditions[0]!.value).toEqual(["open", "pending"]);
    });

    it("null input → undefined", () => {
        expect(parseFilterQuery(null as unknown as string | undefined)).toBeUndefined();
    });

    it("non-object parsed JSON → undefined", () => {
        expect(parseFilterQuery("42")).toBeUndefined();
    });

    it("null parsed JSON → undefined", () => {
        expect(parseFilterQuery("null")).toBeUndefined();
    });

    it("missing field in condition → undefined", () => {
        expect(
            parseFilterQuery(
                JSON.stringify({
                    logic: "AND",
                    conditions: [
                        { operator: "eq", value: "open" },
                    ],
                }),
            ),
        ).toBeUndefined();
    });

    it("missing operator in condition → undefined", () => {
        expect(
            parseFilterQuery(
                JSON.stringify({
                    logic: "AND",
                    conditions: [
                        { field: "status", value: "open" },
                    ],
                }),
            ),
        ).toBeUndefined();
    });

    it("missing value in condition → undefined", () => {
        expect(
            parseFilterQuery(
                JSON.stringify({
                    logic: "AND",
                    conditions: [
                        { field: "status", operator: "eq" },
                    ],
                }),
            ),
        ).toBeUndefined();
    });
});
