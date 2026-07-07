/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { act, renderHook } from "@testing-library/react";

import { useCounter } from "../useCounter";

describe("useCounter", () => {
    it("should return zero by default", () => {
        const { result } = renderHook(() => useCounter());

        expect(result.current.count.count).toBe(0);
    });

    it("should return provided initial value", () => {
        const { result } = renderHook(() => useCounter(5));

        expect(result.current.count.count).toBe(5);
    });

    it("should increment count", () => {
        const { result } = renderHook(() => useCounter());

        act(() => {
            result.current.increment();
        });

        expect(result.current.count.count).toBe(1);
    });

    it("should decrement count", () => {
        const { result } = renderHook(() => useCounter());

        act(() => {
            result.current.decrement();
        });

        expect(result.current.count.count).toBe(-1);
    });
});
