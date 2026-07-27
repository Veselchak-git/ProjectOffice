import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useClickOutside } from ".";

function createRef(element: HTMLElement | null = null) {
    return { current: element } as React.RefObject<HTMLElement | null>;
}

describe("useClickOutside", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("вызывает onOutside при клике вне элемента", () => {
        const onOutside = vi.fn();
        const outsideElement = document.createElement("div");
        document.body.appendChild(outsideElement);

        const ref = createRef(document.createElement("div"));
        document.body.appendChild(ref.current!);

        renderHook(() => useClickOutside(ref, onOutside));

        const event = new MouseEvent("mousedown", { bubbles: true });
        Object.defineProperty(event, "target", { value: outsideElement });
        document.dispatchEvent(event);

        expect(onOutside).toHaveBeenCalledTimes(1);

        document.body.removeChild(outsideElement);
        document.body.removeChild(ref.current!);
    });

    it("не вызывает onOutside при клике внутри элемента", () => {
        const onOutside = vi.fn();
        const innerElement = document.createElement("div");
        document.body.appendChild(innerElement);

        const ref = createRef(innerElement);

        renderHook(() => useClickOutside(ref, onOutside));

        const event = new MouseEvent("mousedown", { bubbles: true });
        Object.defineProperty(event, "target", { value: innerElement });
        document.dispatchEvent(event);

        expect(onOutside).not.toHaveBeenCalled();

        document.body.removeChild(innerElement);
    });

    it("не вызывает onOutside когда ref.current равен null", () => {
        const onOutside = vi.fn();
        const ref = createRef(null);

        renderHook(() => useClickOutside(ref, onOutside));

        const event = new MouseEvent("mousedown", { bubbles: true });
        document.dispatchEvent(event);

        expect(onOutside).not.toHaveBeenCalled();
    });

    it("не устанавливает listener когда enabled = false", () => {
        const onOutside = vi.fn();
        const ref = createRef(document.createElement("div"));

        renderHook(() => useClickOutside(ref, onOutside, false));

        const event = new MouseEvent("mousedown", { bubbles: true });
        document.dispatchEvent(event);

        expect(onOutside).not.toHaveBeenCalled();
    });

    it("убирает listener при анмаунте", () => {
        const onOutside = vi.fn();
        const ref = createRef(document.createElement("div"));

        const { unmount } = renderHook(() => useClickOutside(ref, onOutside));

        unmount();

        const event = new MouseEvent("mousedown", { bubbles: true });
        document.dispatchEvent(event);

        expect(onOutside).not.toHaveBeenCalled();
    });
});
