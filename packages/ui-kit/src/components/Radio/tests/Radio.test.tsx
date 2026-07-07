import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Radio } from "../Radio";

const options = [
    { value: "opt1", label: "Option 1" },
    { value: "opt2", label: "Option 2" },
    { value: "opt3", label: "Option 3" }
];

describe("Radio", () => {
    it("renders all options", () => {
        render(<Radio name="test" options={options} />);

        expect(screen.getByText("Option 1")).toBeInTheDocument();
        expect(screen.getByText("Option 2")).toBeInTheDocument();
        expect(screen.getByText("Option 3")).toBeInTheDocument();
    });

    it("renders with default value", () => {
        render(<Radio name="test" defaultValue="opt2" options={options} />);

        const radio2 = screen.getByDisplayValue("opt2");
        expect(radio2).toBeChecked();
    });

    it("selects option on click", async () => {
        const user = userEvent.setup();
        render(<Radio name="test" options={options} />);

        const radio1 = screen.getByDisplayValue("opt1");
        expect(radio1).not.toBeChecked();

        await user.click(screen.getByText("Option 1"));
        expect(radio1).toBeChecked();
    });
});
