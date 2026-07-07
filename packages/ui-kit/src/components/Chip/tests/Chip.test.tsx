import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Chip } from "../Chip";

describe("Chip", () => {
    it("renders children text", () => {
        render(<Chip>Status</Chip>);

        expect(screen.getByText("Status")).toBeInTheDocument();
    });

    it("renders with accent color by default", () => {
        render(<Chip>Default</Chip>);

        const chip = screen.getByText("Default");
        expect(chip).toHaveClass("ui-kit-chip-color-accent");
    });

    it("renders with specified color", () => {
        render(<Chip color="green">Green</Chip>);

        const chip = screen.getByText("Green");
        expect(chip).toHaveClass("ui-kit-chip-color-green");
    });

    it("renders remove button", () => {
        render(<Chip onRemove={() => {}}>Removable</Chip>);

        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("calls onRemove when remove button is clicked", async () => {
        const user = userEvent.setup();
        let removed = false;
        render(<Chip onRemove={() => { removed = true; }}>Remove me</Chip>);

        await user.click(screen.getByRole("button"));
        expect(removed).toBe(true);
    });

    it("applies disabled class", () => {
        render(<Chip disabled>Disabled</Chip>);

        const chip = screen.getByText("Disabled");
        expect(chip).toHaveClass("ui-kit-chip-disabled");
    });
});
