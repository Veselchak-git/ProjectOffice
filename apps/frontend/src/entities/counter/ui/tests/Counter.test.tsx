/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Counter } from "../Counter";

describe("Counter", () => {
    it("should render controls by role and initial value by data-test", () => {
        render(<Counter />);

        expect(screen.getByRole("button", { name: "Increment" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Decrement" })).toBeInTheDocument();
        expect(screen.getByTestId("count-value")).toHaveTextContent("Count: 0");
    });

    it("should increment by clicking button found by role", async () => {
        const user = userEvent.setup();

        render(<Counter />);

        await user.click(screen.getByRole("button", { name: "Increment" }));

        expect(screen.getByRole("status")).toHaveTextContent("Count: 1");
    });

    it("should decrement by clicking control found by data-test", async () => {
        const user = userEvent.setup();

        render(<Counter />);

        await user.click(screen.getByTestId("decrement-button"));

        expect(screen.getByRole("status")).toHaveTextContent("Count: -1");
    });
});
