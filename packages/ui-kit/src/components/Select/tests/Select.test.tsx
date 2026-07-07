import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { Select } from "../Select";

const options = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" }
];

describe("Select", () => {
    it("renders label and trigger", () => {
        render(
            <Select
                label="Choose"
                placeholder="Select an option"
                options={options}
            />
        );

        expect(screen.getByText("Choose")).toBeInTheDocument();
    });

    it("renders error message when color is error", () => {
        render(
            <Select
                label="Choose"
                color="error"
                errorMessage="This field is required"
                options={options}
            />
        );

        expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("does not render error message when color is default", () => {
        render(
            <Select
                label="Choose"
                errorMessage="Hidden error"
                options={options}
            />
        );

        expect(screen.queryByText("Hidden error")).not.toBeInTheDocument();
    });

    it("renders with default value", () => {
        render(
            <Select
                label="Choose"
                defaultValue="option2"
                options={options}
            />
        );

        const hiddenInput = document.querySelector("input[value='option2']");
        expect(hiddenInput).toBeInTheDocument();
    });
});
