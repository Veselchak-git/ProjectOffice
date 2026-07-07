import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Checkbox } from "../Checkbox";

describe("Checkbox", () => {
    it("renders with label", () => {
        render(<Checkbox label="Accept terms" />);

        expect(screen.getByText("Accept terms")).toBeInTheDocument();
    });

    it("renders checked by default", () => {
        render(<Checkbox label="Checked" defaultChecked />);

        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toBeChecked();
    });

    it("toggles on click", async () => {
        const user = userEvent.setup();
        render(<Checkbox label="Toggle me" />);

        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).not.toBeChecked();

        await user.click(checkbox);
        expect(checkbox).toBeChecked();
    });

    it("renders disabled checkbox", () => {
        render(<Checkbox label="Disabled" disabled />);

        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toHaveAttribute("aria-disabled", "true");
    });

    it("renders with size L class", () => {
        render(<Checkbox label="Large" inputSize="l" />);

        const container = screen.getByText("Large").closest(".ui-kit-checkbox");
        expect(container).toHaveClass("ui-kit-checkbox-size-l");
    });
});
