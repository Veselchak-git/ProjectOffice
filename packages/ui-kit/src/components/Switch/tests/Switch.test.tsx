import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Switch } from "../Switch";

describe("Switch", () => {
    it("renders with label", () => {
        render(<Switch label="Enable notifications" />);

        expect(screen.getByText("Enable notifications")).toBeInTheDocument();
    });

    it("renders checked by default", () => {
        render(<Switch label="On" defaultChecked />);

        const switchEl = screen.getByRole("switch");
        expect(switchEl).toBeChecked();
    });

    it("toggles on click", async () => {
        const user = userEvent.setup();
        render(<Switch label="Toggle me" />);

        const switchEl = screen.getByRole("switch");
        expect(switchEl).not.toBeChecked();

        await user.click(switchEl);
        expect(switchEl).toBeChecked();
    });

    it("renders disabled switch", () => {
        render(<Switch label="Disabled" disabled />);

        const switchEl = screen.getByRole("switch");
        expect(switchEl).toHaveAttribute("aria-disabled", "true");
    });

    it("renders with size L class", () => {
        render(<Switch label="Large" inputSize="l" />);

        const container = screen.getByText("Large").closest(".ui-kit-switch");
        expect(container).toHaveClass("ui-kit-switch-size-l");
    });
});
