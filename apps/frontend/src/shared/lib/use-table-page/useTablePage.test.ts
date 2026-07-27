import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDynamicPerPage } from "@/shared/lib/use-dynamic-per-page";

import { useTablePage } from "./useTablePage";

vi.mock("@helpdesk-portal/ui-kit", () => ({
    BrowserStorage: {
        create: vi.fn(() => ({
            getValue: vi.fn(() => null),
            setValue: vi.fn(),
            remove: vi.fn(),
            getArray: vi.fn(() => null),
            setArray: vi.fn()
        }))
    }
}));

vi.mock("@/shared/lib/use-click-outside", () => ({
    useClickOutside: vi.fn()
}));

vi.mock("@/shared/lib/use-dynamic-per-page", () => ({
    useDynamicPerPage: vi.fn(() => ({ perPage: 10, ready: true }))
}));

vi.mock("@/shared/lib/use-persist-column-settings", () => ({
    usePersistColumnSettings: vi.fn()
}));

vi.mock("@/shared/ui/data-table", () => ({
    reorderColumn: vi.fn()
}));

function renderUseTablePage() {
    const onColumnVisibilityChange = vi.fn();
    const onColumnOrderChange = vi.fn();

    return renderHook(() =>
        useTablePage({
            page: "issues",
            columnVisibility: {},
            columnOrder: ["name", "status"],
            onColumnVisibilityChange,
            onColumnOrderChange
        })
    );
}

describe("useTablePage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("возвращает начальные значения", () => {
        const { result } = renderUseTablePage();

        expect(result.current.pageIndex).toBe(0);
        expect(result.current.columnsOpen).toBe(false);
        expect(result.current.sorting).toEqual([]);
        expect(result.current.perPage).toBe(10);
        expect(result.current.ready).toBe(true);
    });

    it("возвращает ref-ы", () => {
        const { result } = renderUseTablePage();

        expect(result.current.containerRef).toBeDefined();
        expect(result.current.columnsRef).toBeDefined();
    });

    it("setPageIndex обновляет pageIndex", () => {
        const { result } = renderUseTablePage();

        act(() => {
            result.current.setPageIndex(2);
        });

        expect(result.current.pageIndex).toBe(2);
    });

    it("setSorting обновляет sorting", () => {
        const { result } = renderUseTablePage();

        act(() => {
            result.current.setSorting([{ id: "name", desc: true }]);
        });

        expect(result.current.sorting).toEqual([{ id: "name", desc: true }]);
    });

    it("setColumnsOpen обновляет columnsOpen", () => {
        const { result } = renderUseTablePage();

        act(() => {
            result.current.setColumnsOpen(true);
        });

        expect(result.current.columnsOpen).toBe(true);
    });

    it("handleDragEnd вызывает reorderColumn", async () => {
        const { reorderColumn } = await import("@/shared/ui/data-table");
        const { result } = renderUseTablePage();

        const event = { active: { id: "name" }, over: { id: "status" } } as never;

        act(() => {
            result.current.handleDragEnd(event);
        });

        expect(reorderColumn).toHaveBeenCalledWith(event, ["name", "status"], expect.any(Function));
    });

    it("подписывается на useDynamicPerPage", () => {
        renderUseTablePage();

        expect(useDynamicPerPage).toHaveBeenCalledWith(expect.anything(), {
            rowHeight: 48,
            theadHeight: 36,
            paginationHeight: 34,
            min: 5
        });
    });
});
