/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { render, screen } from "@testing-library/react";

import { Button } from "../Button";

describe("Button", () => {
    it("should render label", () => {
        render(<Button>Click me</Button>);

        expect(screen.getByRole("button")).toHaveTextContent("Click me");
    });

    it("should apply variant and color modifiers", () => {
        render(
            <Button color="error" variant="stroke" size="l">
                Delete
            </Button>
        );

        const button = screen.getByRole("button");

        expect(button).toHaveClass("ui-kit-btn-stroke");
        expect(button).toHaveClass("ui-kit-btn-error");
        expect(button).toHaveClass("ui-kit-btn-size-l");
    });

    it("should render icon-only content", () => {
        render(
            <Button iconOnly aria-label="Settings">
                +
            </Button>
        );

        expect(screen.getByRole("button", { name: "Settings" })).toHaveTextContent("+");
        expect(screen.getByRole("button")).toHaveClass("ui-kit-btn-icon-only");
    });
});
