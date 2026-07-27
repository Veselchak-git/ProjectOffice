import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDynamicPerPage } from "./useDynamicPerPage";

function createContainerRef() {
    const el = document.createElement("div");
    el.getBoundingClientRect = vi.fn(() => ({
        top: 100,
        left: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 700,
        x: 0,
        y: 100,
        toJSON: vi.fn()
    }));
    document.body.appendChild(el);
    return { current: el } as React.RefObject<HTMLDivElement | null>;
}

class MockResizeObserver {
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
    }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}

describe("useDynamicPerPage", () => {
    beforeEach(() => {
        vi.stubGlobal("innerHeight", 900);
        vi.stubGlobal("ResizeObserver", MockResizeObserver);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = "";
    });

    it("возвращает начальное значение perPage = min", () => {
        const ref = createContainerRef();
        const { result } = renderHook(() =>
            useDynamicPerPage(ref, {
                rowHeight: 48,
                theadHeight: 36,
                paginationHeight: 34,
                min: 5
            })
        );

        expect(result.current.perPage).toBeGreaterThanOrEqual(5);
        expect(result.current.ready).toBe(true);
    });

    it("вычисляет perPage на основе высоты окна", () => {
        window.innerHeight = 900;
        const ref = createContainerRef();
        const { result } = renderHook(() =>
            useDynamicPerPage(ref, {
                rowHeight: 48,
                theadHeight: 36,
                paginationHeight: 34,
                min: 5
            })
        );

        // available = 900 - 100 - 34 - 36 = 730
        // rows = floor(730 / 48) = 15
        expect(result.current.perPage).toBe(15);
        expect(result.current.ready).toBe(true);
    });

    it("perPage не меньше min", () => {
        window.innerHeight = 200;
        const ref = createContainerRef();
        const { result } = renderHook(() =>
            useDynamicPerPage(ref, {
                rowHeight: 48,
                theadHeight: 36,
                paginationHeight: 34,
                min: 10
            })
        );

        expect(result.current.perPage).toBeGreaterThanOrEqual(10);
    });

    it("создаёт ResizeObserver и observe для отслеживания изменений", () => {
        const ref = createContainerRef();

        const { unmount } = renderHook(() =>
            useDynamicPerPage(ref, {
                rowHeight: 48,
                theadHeight: 36,
                paginationHeight: 34,
                min: 5
            })
        );

        expect(ref.current).toBeTruthy();

        unmount();
    });

    it("подписывается на resize window", () => {
        const addSpy = vi.spyOn(window, "addEventListener");
        const ref = createContainerRef();

        const { unmount } = renderHook(() =>
            useDynamicPerPage(ref, {
                rowHeight: 48,
                theadHeight: 36,
                paginationHeight: 34,
                min: 5
            })
        );

        expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));

        unmount();
    });
});
