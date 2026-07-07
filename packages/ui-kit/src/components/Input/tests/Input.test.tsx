import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Input } from "../Input";

describe("Input", () => {
    it("renders label and input", () => {
        render(<Input label="Name" placeholder="Enter name" />);

        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
    });

    it("renders error message when color is error", () => {
        render(
            <Input
                label="Name"
                color="error"
                errorMessage="This field is required"
            />
        );

        expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("does not render error message when color is default", () => {
        render(
            <Input
                label="Name"
                errorMessage="This field is required"
            />
        );

        expect(screen.queryByText("This field is required")).not.toBeInTheDocument();
    });

    it("renders disabled input", () => {
        render(<Input label="Name" disabled placeholder="Disabled" />);

        expect(screen.getByPlaceholderText("Disabled")).toBeDisabled();
    });

    it("applies focus state on focus", async () => {
        const user = userEvent.setup();
        render(<Input label="Name" placeholder="Focus me" />);

        const input = screen.getByPlaceholderText("Focus me");
        const container = input.closest(".ui-kit-input");

        expect(container).not.toHaveClass("ui-kit-input-focused");

        await user.click(input);
        expect(container).toHaveClass("ui-kit-input-focused");
    });

    it("renders with start icon", () => {
        render(
            <Input
                label="Search"
                placeholder="Search"
                startIcon={<span data-test="start-icon">S</span>}
            />
        );

        expect(screen.getByTestId("start-icon")).toBeInTheDocument();
    });
});
