import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearFilterState, loadFilterState, saveFilterState } from "./filter-storage";
import type { FilterState, TableFilterConfig } from "./types";
import { useFilterState } from "./useFilterState";

vi.mock("./filter-storage", () => ({
    loadFilterState: vi.fn(),
    saveFilterState: vi.fn(),
    clearFilterState: vi.fn()
}));

const mockLoadFilterState = vi.mocked(loadFilterState);
const mockSaveFilterState = vi.mocked(saveFilterState);
const mockClearFilterState = vi.mocked(clearFilterState);

const config: TableFilterConfig = {
    fields: [
        { field: "name", label: "Name", type: "text" },
        {
            field: "status",
            label: "Status",
            type: "enum",
            enumValues: [{ value: "active", label: "Active" }]
        }
    ]
};

beforeEach(() => {
    vi.clearAllMocks();
    mockLoadFilterState.mockReturnValue(null);
});

afterEach(() => {
    vi.restoreAllMocks();
});

function TestComponent({ tableKey }: { tableKey: string }) {
    const {
        filters,
        addCondition,
        removeCondition,
        updateCondition,
        toggleLogic,
        applyFilters,
        resetFilters,
        hasActiveFilters,
        filterQueryString
    } = useFilterState(tableKey, config);

    return (
        <div>
            <button data-test="add-condition" onClick={() => addCondition(0)}>
                Add
            </button>
            <button data-test="remove-condition" onClick={() => removeCondition(0, 0)}>
                Remove
            </button>
            <button data-test="toggle-logic" onClick={() => toggleLogic(0)}>
                Toggle
            </button>
            <button data-test="apply-filters" onClick={() => applyFilters()}>
                Apply
            </button>
            <button data-test="reset-filters" onClick={resetFilters}>
                Reset
            </button>
            <button data-test="update-condition" onClick={() => updateCondition(0, 0, { value: "test" })}>
                Update
            </button>
            <span data-test="condition-count">{filters.groups[0]?.conditions.length ?? 0}</span>
            <span data-test="logic">{filters.groups[0]?.logic}</span>
            <span data-test="has-active">{hasActiveFilters ? "true" : "false"}</span>
            <span data-test="query-string">{filterQueryString ?? "none"}</span>
        </div>
    );
}

describe("useFilterState", () => {
    it("инициализируется с пустым состоянием, когда localStorage пуст", () => {
        render(<TestComponent tableKey="test-table" />);

        expect(screen.getByTestId("condition-count")).toHaveTextContent("0");
        expect(screen.getByTestId("logic")).toHaveTextContent("AND");
    });

    it("addCondition добавляет условие в группу", () => {
        render(<TestComponent tableKey="test-table" />);

        fireEvent.click(screen.getByTestId("add-condition"));

        expect(screen.getByTestId("condition-count")).toHaveTextContent("1");
    });

    it("addCondition не добавляет при MAX_CONDITIONS (2)", () => {
        render(<TestComponent tableKey="test-table" />);

        fireEvent.click(screen.getByTestId("add-condition"));
        fireEvent.click(screen.getByTestId("add-condition"));
        fireEvent.click(screen.getByTestId("add-condition"));

        expect(screen.getByTestId("condition-count")).toHaveTextContent("2");
    });

    it("removeCondition удаляет условие", () => {
        render(<TestComponent tableKey="test-table" />);

        fireEvent.click(screen.getByTestId("add-condition"));
        fireEvent.click(screen.getByTestId("add-condition"));
        expect(screen.getByTestId("condition-count")).toHaveTextContent("2");

        fireEvent.click(screen.getByTestId("remove-condition"));

        expect(screen.getByTestId("condition-count")).toHaveTextContent("1");
    });

    it("toggleLogic переключает AND ↔ OR", () => {
        render(<TestComponent tableKey="test-table" />);

        expect(screen.getByTestId("logic")).toHaveTextContent("AND");

        fireEvent.click(screen.getByTestId("toggle-logic"));

        expect(screen.getByTestId("logic")).toHaveTextContent("OR");

        fireEvent.click(screen.getByTestId("toggle-logic"));

        expect(screen.getByTestId("logic")).toHaveTextContent("AND");
    });

    it("applyFilters сохраняет в localStorage", () => {
        render(<TestComponent tableKey="test-table" />);

        fireEvent.click(screen.getByTestId("add-condition"));
        fireEvent.click(screen.getByTestId("apply-filters"));

        expect(mockSaveFilterState).toHaveBeenCalled();
    });

    it("resetFilters очищает state и localStorage", () => {
        render(<TestComponent tableKey="test-table" />);

        fireEvent.click(screen.getByTestId("add-condition"));
        fireEvent.click(screen.getByTestId("reset-filters"));

        expect(mockClearFilterState).toHaveBeenCalledWith("test-table");
        expect(screen.getByTestId("condition-count")).toHaveTextContent("0");
    });

    it("hasActiveFilters — true после applyFilters", () => {
        render(<TestComponent tableKey="test-table" />);

        expect(screen.getByTestId("has-active")).toHaveTextContent("false");

        fireEvent.click(screen.getByTestId("add-condition"));
        fireEvent.click(screen.getByTestId("apply-filters"));

        expect(screen.getByTestId("has-active")).toHaveTextContent("true");
    });

    it("filterQueryString — валидный JSON строка", () => {
        render(<TestComponent tableKey="test-table" />);

        fireEvent.click(screen.getByTestId("add-condition"));
        fireEvent.click(screen.getByTestId("apply-filters"));

        const queryString = screen.getByTestId("query-string").textContent;
        expect(queryString).not.toBe("none");

        const parsed = JSON.parse(queryString!);
        expect(parsed.logic).toBe("AND");
        expect(Array.isArray(parsed.conditions)).toBe(true);
        expect(parsed.conditions).toHaveLength(1);
    });

    it("filterQueryString — undefined когда нет активных фильтров", () => {
        render(<TestComponent tableKey="test-table" />);

        expect(screen.getByTestId("query-string")).toHaveTextContent("none");
    });

    it("загружает сохранённое состояние из localStorage при монтировании", () => {
        const savedState: FilterState = {
            groups: [
                {
                    logic: "OR",
                    conditions: [{ id: "saved-1", field: "status", operator: "eq", value: "active" }]
                }
            ],
            fieldConfigs: config.fields
        };
        mockLoadFilterState.mockReturnValue(savedState);

        render(<TestComponent tableKey="test-table" />);

        expect(screen.getByTestId("condition-count")).toHaveTextContent("1");
        expect(screen.getByTestId("logic")).toHaveTextContent("OR");
    });
});
