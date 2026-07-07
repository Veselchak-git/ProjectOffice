/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { render, screen } from "@testing-library/react";

import { SimpleWrapper } from "./SimpleWrapper";

describe("SimpleWrapper", () => {
    it("should render", () => {
        render(<SimpleWrapper>Hello</SimpleWrapper>);
        expect(screen.getByText("Hello")).toBeInTheDocument();
    });
});
