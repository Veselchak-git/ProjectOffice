/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FieldOption, FilterCondition } from "../../lib/use-table-filter/types";
import { FilterPopover } from "./FilterPopover";

const fields: FieldOption[] = [
    { field: "login", label: "Логин", type: "text" },
    {
        field: "role",
        label: "Роль",
        type: "enum",
        enumValues: [
            { value: "ADMIN", label: "Администратор" },
            { value: "USER", label: "Пользователь" }
        ]
    },
    { field: "createdAt", label: "Дата создания", type: "date" }
];

const appliedConditions: FilterCondition[] = [{ id: "c1", field: "login", operator: "contains", value: "admin" }];

describe("FilterPopover", () => {
    const defaultProps = {
        fields,
        logic: "AND" as const,
        initialField: "login",
        onApply: vi.fn(),
        onReset: vi.fn(),
        onClose: vi.fn(),
        className: ""
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders null when isOpen=false", () => {
        const { container } = render(<FilterPopover {...defaultProps} isOpen={false} conditions={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it("renders popover when isOpen=true", () => {
        render(<FilterPopover {...defaultProps} isOpen={true} conditions={[]} />);
        expect(screen.getByTestId("filter-popover")).toBeInTheDocument();
    });

    it("restores applied conditions on reopen", () => {
        // First render — closed
        const { rerender } = render(<FilterPopover {...defaultProps} isOpen={false} conditions={[]} />);
        expect(screen.queryByTestId("filter-popover")).not.toBeInTheDocument();

        // Open — with applied conditions
        rerender(<FilterPopover {...defaultProps} isOpen={true} conditions={appliedConditions} />);
        expect(screen.getByTestId("filter-popover")).toBeInTheDocument();

        // Wait for effects + flush state updates
        // The useEffect should have restored field="login", operator="contains", value="admin"
        // For row 0 with initialField, the field label should show
        expect(screen.getByTestId("filter-field-label-0")).toHaveTextContent("Логин");

        // The value input should show "admin"
        const valueInput = screen.getByTestId("filter-value-0") as HTMLInputElement;
        expect(valueInput.value).toBe("admin");
    });

    it("preserves edited values after close and reopen with same conditions", () => {
        // Open with conditions
        const { rerender } = render(<FilterPopover {...defaultProps} isOpen={true} conditions={appliedConditions} />);

        // User edits the value
        const valueInput = screen.getByTestId("filter-value-0") as HTMLInputElement;
        fireEvent.change(valueInput, { target: { value: "test-edit" } });
        expect(valueInput.value).toBe("test-edit");

        // Close
        rerender(<FilterPopover {...defaultProps} isOpen={false} conditions={appliedConditions} />);
        expect(screen.queryByTestId("filter-popover")).not.toBeInTheDocument();

        // Reopen with same conditions — should restore conditions, NOT the edit
        rerender(<FilterPopover {...defaultProps} isOpen={true} conditions={appliedConditions} />);

        const restoredInput = screen.getByTestId("filter-value-0") as HTMLInputElement;
        expect(restoredInput.value).toBe("admin");
    });

    it("restores conditions after apply + close + reopen cycle", () => {
        const onApply = vi.fn();
        const { rerender } = render(
            <FilterPopover {...defaultProps} isOpen={true} conditions={[]} onApply={onApply} />
        );

        // User fills in fields
        const valueInput = screen.getByTestId("filter-value-0") as HTMLInputElement;
        fireEvent.change(valueInput, { target: { value: "new-user" } });

        // Apply
        fireEvent.click(screen.getByTestId("filter-apply"));
        expect(onApply).toHaveBeenCalled();

        // Parent updates conditions (simulating a handleFilterApply call)
        const newConditions: FilterCondition[] = [
            { id: "c2", field: "login", operator: "contains", value: "new-user" }
        ];

        // Close
        rerender(<FilterPopover {...defaultProps} isOpen={false} conditions={newConditions} onApply={onApply} />);

        // Reopen with the applied conditions
        rerender(<FilterPopover {...defaultProps} isOpen={true} conditions={newConditions} onApply={onApply} />);

        const restoredInput = screen.getByTestId("filter-value-0") as HTMLInputElement;
        expect(restoredInput.value).toBe("new-user");
    });
});
