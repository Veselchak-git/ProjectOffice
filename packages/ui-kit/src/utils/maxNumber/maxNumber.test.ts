/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { maxNumber } from "./maxNumber";

describe("maxNumber", () => {
    it("should return the maximum number", () => {
        expect(maxNumber(1, 2)).toBe(2);
    });
});
