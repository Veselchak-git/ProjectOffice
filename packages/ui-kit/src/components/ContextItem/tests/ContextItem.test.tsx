import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ContextItem } from "../ContextItem";

describe("ContextItem", () => {
    it("renders label", () => {
        render(<ContextItem label="Delete" />);

        expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    it("renders as a button", () => {
        render(<ContextItem label="Click me" />);

        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("calls onClick when clicked", async () => {
        const user = userEvent.setup();
        let clicked = false;
        render(<ContextItem label="Action" onClick={() => { clicked = true; }} />);

        await user.click(screen.getByRole("button"));
        expect(clicked).toBe(true);
    });

    it("renders disabled button", () => {
        render(<ContextItem label="Disabled" disabled />);

        expect(screen.getByRole("button")).toBeDisabled();
    });

    it("renders with icon", () => {
        render(
            <ContextItem
                label="Edit"
                icon={<span data-test="icon">*</span>}
            />
        );

        expect(screen.getByTestId("icon")).toBeInTheDocument();
    });

    it("renders with end icon", () => {
        render(
            <ContextItem
                label="Open"
                endIcon={<span data-test="end-icon">&gt;</span>}
            />
        );

        expect(screen.getByTestId("end-icon")).toBeInTheDocument();
    });
});
