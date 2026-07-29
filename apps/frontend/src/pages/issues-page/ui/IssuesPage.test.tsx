/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@/shared/lib/auth";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";

import { IssuesPage } from "./IssuesPage";

// ── Моки ──────────────────────────────────────────────────────────────────────

const mockQueryFn = vi.fn();
const mockMutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock("react-router", async importOriginal => {
    const actual = await importOriginal<typeof import("react-router")>();
    return {
        ...actual,
        useNavigate: vi.fn(),
        useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()])
    };
});

vi.mock("@tanstack/react-query", () => ({
    useQuery: (...args: unknown[]) => mockQueryFn(...args),
    useMutation: vi.fn(() => ({
        mutateAsync: mockMutateAsync,
        isPending: false
    })),
    useQueryClient: vi.fn(() => ({
        invalidateQueries: vi.fn()
    })),
    keepPreviousData: vi.fn()
}));

vi.mock("@/shared/lib/redux", () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn()
}));

vi.mock("@/shared/lib/auth", async importOriginal => {
    const actual = await importOriginal<typeof import("@/shared/lib/auth")>();
    return { ...actual, useAuth: vi.fn() };
});

vi.mock("@/shared/lib/error-boundary/ErrorModal", () => ({
    ErrorModal: ({ isOpen, message }: { isOpen: boolean; message: string }) =>
        isOpen ? <div data-test="error-modal">{message}</div> : null
}));

vi.mock("@/shared/ui/export-modal", () => ({
    ExportModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-test="export-modal" /> : null)
}));

vi.mock("@/shared/lib/use-table", () => ({
    useTable: vi.fn(() => ({
        table: {}
    }))
}));

vi.mock("@/shared/lib/use-table-filter", () => ({
    useFilterState: vi.fn(() => ({
        filters: { groups: [] },
        resetFilters: vi.fn(),
        hasActiveFilters: false,
        filterQueryString: "",
        removeCondition: vi.fn(),
        allConditions: [],
        currentLogic: "AND",
        applyConditions: vi.fn(),
        removeFieldConditions: vi.fn()
    })),
    usePopoverKeys: vi.fn(() => ({ popoverKeys: {}, bumpKey: vi.fn() }))
}));

vi.mock("@/shared/lib/use-table-page", () => ({
    useTablePage: vi.fn(() => ({
        containerRef: { current: null },
        columnsRef: { current: null },
        columnsOpen: false,
        setColumnsOpen: vi.fn(),
        handleDragEnd: vi.fn(),
        sorting: [],
        perPage: 20,
        ready: true,
        pageIndex: 0,
        setPageIndex: vi.fn(),
        setSorting: vi.fn()
    }))
}));

vi.mock("@/shared/ui/data-table", () => ({
    DataTable: () => <div data-test="data-table" />,
    FilterChips: () => <div data-test="filter-chips" />,
    ColumnHeader: ({ title }: { title: string }) => <th>{title}</th>,
    FilterPopover: () => null,
    createColumnMeta: (columns: { id: string; label: string }[]) => ({
        ALL_COLUMNS: columns.map(c => ({ ...c, visible: true })),
        COLUMN_IDS: columns.map(c => c.id),
        DEFAULT_COLUMN_ORDER: columns.map(c => c.id),
        DEFAULT_COLUMN_VISIBILITY: Object.fromEntries(columns.map(c => [c.id, true]))
    }),
    useFilterHeader: () => (title: string) => () => <th>{title}</th>
}));

vi.mock("@/shared/ui/page-header", () => ({
    PageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => (
        <div data-test="page-header">
            <h1>{title}</h1>
            {actions}
        </div>
    )
}));

vi.mock("@/shared/ui/columns-dropdown", () => ({
    ColumnsDropdown: () => <div data-test="columns-dropdown" />
}));

vi.mock("@helpdesk-portal/icons/Export.svg?react", () => ({
    default: () => <span data-test="mock-export-icon" />
}));

// ── Вспомогательные функции ───────────────────────────────────────────────────

function renderPage() {
    return render(
        <MemoryRouter>
            <IssuesPage />
        </MemoryRouter>
    );
}

// ── Тесты ─────────────────────────────────────────────────────────────────────

describe("IssuesPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAppDispatch).mockReturnValue(vi.fn());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useAppSelector as any).mockImplementation((selector: (...args: unknown[]) => unknown) => {
            if (typeof selector === "function") {
                try {
                    return selector({
                        issuesPage: { columnVisibility: {}, columnOrder: [], rowSelection: {} }
                    });
                } catch {
                    return false;
                }
            }
            return false;
        });
        vi.mocked(useAuth).mockReturnValue({
            user: { id: "1", login: "admin", role: "ADMIN" },
            loading: false,
            login: vi.fn(),
            logout: vi.fn()
        });
    });

    it("renders page header with title", () => {
        mockQueryFn.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: false,
            error: undefined
        });

        renderPage();

        expect(screen.getByText("page.title")).toBeInTheDocument();
    });

    it("renders export button", () => {
        mockQueryFn.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: false,
            error: undefined
        });

        renderPage();

        expect(screen.getByRole("button", { name: "actions.export" })).toBeInTheDocument();
    });

    it("renders table when no data", () => {
        mockQueryFn.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: false,
            error: undefined
        });

        renderPage();

        expect(screen.getByTestId("data-table")).toBeInTheDocument();
    });

    it("shows error modal when query fails", () => {
        mockQueryFn.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: true,
            error: new Error("Failed to load")
        });

        renderPage();

        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
    });

    it("renders columns dropdown", () => {
        mockQueryFn.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: false,
            error: undefined
        });

        renderPage();

        expect(screen.getByTestId("columns-dropdown")).toBeInTheDocument();
    });
});
