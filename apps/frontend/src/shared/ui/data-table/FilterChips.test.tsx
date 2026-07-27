import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FieldOption, FilterCondition } from "../../lib/use-table-filter/types";
import { FilterChips } from "./FilterChips";

const fieldConfigs: FieldOption[] = [
    { field: "status", label: "Статус", type: "enum", enumValues: [{ value: "active", label: "Активен" }] },
    { field: "name", label: "Название", type: "text" }
];

const conditions: FilterCondition[] = [
    { id: "1", field: "status", operator: "eq", value: "active" },
    { id: "2", field: "name", operator: "contains", value: "test" }
];

describe("FilterChips", () => {
    const defaultProps = {
        conditions,
        fieldConfigs,
        onRemove: vi.fn(),
        onClearAll: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders null when conditions are empty", () => {
        const { container } = render(<FilterChips {...defaultProps} conditions={[]} />);

        expect(container.firstChild).toBeNull();
    });

    it("renders chips for each condition", () => {
        render(<FilterChips {...defaultProps} />);

        const chips = screen.getAllByTestId("filter-chip");
        expect(chips).toHaveLength(2);
        expect(screen.getByText("Статус: Активен")).toBeInTheDocument();
        expect(screen.getByText("Название: test")).toBeInTheDocument();
    });

    it("renders clear all button", () => {
        render(<FilterChips {...defaultProps} />);

        expect(screen.getByTestId("filter-chips-clear")).toBeInTheDocument();
        expect(screen.getByText("Сбросить всё")).toBeInTheDocument();
    });

    it("calls onRemove with condition id when chip remove button is clicked", () => {
        const onRemove = vi.fn();
        render(<FilterChips {...defaultProps} onRemove={onRemove} />);

        const removeButtons = screen.getAllByTestId("filter-chip-remove");
        fireEvent.click(removeButtons[0]!);

        expect(onRemove).toHaveBeenCalledWith("1");
    });

    it("calls onClearAll when clear all button is clicked", () => {
        const onClearAll = vi.fn();
        render(<FilterChips {...defaultProps} onClearAll={onClearAll} />);

        fireEvent.click(screen.getByTestId("filter-chips-clear"));

        expect(onClearAll).toHaveBeenCalledOnce();
    });

    it("skips condition when field config is not found", () => {
        const conditionsWithUnknown: FilterCondition[] = [
            { id: "1", field: "unknown", operator: "eq", value: "something" }
        ];

        render(<FilterChips {...defaultProps} conditions={conditionsWithUnknown} />);

        expect(screen.queryByTestId("filter-chip")).not.toBeInTheDocument();
        expect(screen.getByTestId("filter-chips")).toBeInTheDocument();
    });
});
