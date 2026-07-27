import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TagPicker } from "./TagPicker";
import type { TagPickerOption } from "./TagPicker";

const options: TagPickerOption[] = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "pending", label: "Pending" }
];

describe("TagPicker", () => {
    const defaultProps = {
        options,
        selected: [],
        onChange: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders trigger with placeholder text", () => {
        render(<TagPicker {...defaultProps} placeholder="Choose..." />);

        expect(screen.getByTestId("tag-picker-trigger")).toBeInTheDocument();
        expect(screen.getByText("Choose...")).toBeInTheDocument();
    });

    it("renders trigger with count when items are selected", () => {
        render(<TagPicker {...defaultProps} selected={["active", "inactive"]} />);

        expect(screen.getByText("2 selected")).toBeInTheDocument();
    });

    it("opens dropdown on trigger click", () => {
        render(<TagPicker {...defaultProps} />);

        expect(screen.queryByTestId("tag-picker-dropdown")).not.toBeInTheDocument();

        fireEvent.click(screen.getByTestId("tag-picker-trigger"));

        expect(screen.getByTestId("tag-picker-dropdown")).toBeInTheDocument();
        expect(screen.getAllByTestId("tag-picker-option")).toHaveLength(3);
    });

    it("closes dropdown on second trigger click", () => {
        render(<TagPicker {...defaultProps} />);

        fireEvent.click(screen.getByTestId("tag-picker-trigger"));
        expect(screen.getByTestId("tag-picker-dropdown")).toBeInTheDocument();

        fireEvent.click(screen.getByTestId("tag-picker-trigger"));
        expect(screen.queryByTestId("tag-picker-dropdown")).not.toBeInTheDocument();
    });

    it("selects a value when checkbox is clicked", () => {
        const onChange = vi.fn();
        render(<TagPicker {...defaultProps} onChange={onChange} />);

        fireEvent.click(screen.getByTestId("tag-picker-trigger"));
        fireEvent.click(screen.getAllByRole("checkbox")[0]!);

        expect(onChange).toHaveBeenCalledWith(["active"]);
    });

    it("deselects a value when checkbox is clicked", () => {
        const onChange = vi.fn();
        render(<TagPicker {...defaultProps} selected={["active", "inactive"]} onChange={onChange} />);

        fireEvent.click(screen.getByTestId("tag-picker-trigger"));
        fireEvent.click(screen.getAllByRole("checkbox")[0]!);

        expect(onChange).toHaveBeenCalledWith(["inactive"]);
    });

    it("closes dropdown on outside click", () => {
        render(
            <div>
                <span data-test="outside">Outside</span>
                <TagPicker {...defaultProps} />
            </div>
        );

        fireEvent.click(screen.getByTestId("tag-picker-trigger"));
        expect(screen.getByTestId("tag-picker-dropdown")).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByTestId("outside"));
        expect(screen.queryByTestId("tag-picker-dropdown")).not.toBeInTheDocument();
    });

    it("closes dropdown on Escape key", () => {
        render(<TagPicker {...defaultProps} />);

        fireEvent.click(screen.getByTestId("tag-picker-trigger"));
        expect(screen.getByTestId("tag-picker-dropdown")).toBeInTheDocument();

        fireEvent.keyDown(document, { key: "Escape" });
        expect(screen.queryByTestId("tag-picker-dropdown")).not.toBeInTheDocument();
    });

    it("sets aria-expanded correctly", () => {
        render(<TagPicker {...defaultProps} />);

        const trigger = screen.getByTestId("tag-picker-trigger");
        expect(trigger).toHaveAttribute("aria-expanded", "false");

        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("has correct aria attributes on dropdown", () => {
        render(<TagPicker {...defaultProps} />);

        fireEvent.click(screen.getByTestId("tag-picker-trigger"));

        const dropdown = screen.getByTestId("tag-picker-dropdown");
        expect(dropdown).toHaveAttribute("role", "listbox");
        expect(dropdown).toHaveAttribute("aria-multiselectable", "true");
    });
});
