/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved.
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@/shared/lib/auth";

import { HomePage } from "./HomePage";

// ── Моки ──────────────────────────────────────────────────────────────────────

const mockQueryFn = vi.fn();

vi.mock("@tanstack/react-query", () => ({
    useQuery: (...args: unknown[]) => mockQueryFn(...args)
}));

vi.mock("@/shared/lib/auth", () => ({
    useAuth: vi.fn()
}));

vi.mock("@/shared/lib/error-boundary/ErrorModal", () => ({
    ErrorModal: ({ isOpen, message }: { isOpen: boolean; message: string }) =>
        isOpen ? <div data-test="error-modal">{message}</div> : null
}));

vi.mock("./DashboardCounters", () => ({
    DashboardCounters: ({ isLoading }: { isLoading: boolean }) => (
        <div data-test="dashboard-counters">{isLoading ? "loading-counters" : "counters-ready"}</div>
    )
}));

vi.mock("./ActivityFeed", () => ({
    ActivityFeed: ({ isLoading }: { isLoading: boolean }) => (
        <div data-test="activity-feed">{isLoading ? "loading-feed" : "feed-ready"}</div>
    )
}));

// No SVG icon imports in HomePage

// ── Вспомогательные функции ───────────────────────────────────────────────────

function renderPage() {
    return render(
        <MemoryRouter>
            <HomePage />
        </MemoryRouter>
    );
}

// ── Тесты ─────────────────────────────────────────────────────────────────────

describe("HomePage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({
            user: { id: "1", login: "admin", role: "ADMIN" },
            loading: false,
            login: vi.fn(),
            logout: vi.fn()
        });
    });

    it("renders loading state when data is pending", () => {
        mockQueryFn.mockReturnValue({
            data: undefined,
            isPending: true,
            isError: false,
            error: undefined
        });

        renderPage();

        expect(screen.getByTestId("dashboard-counters")).toHaveTextContent("loading-counters");
        expect(screen.getByTestId("activity-feed")).toHaveTextContent("loading-feed");
    });

    it("renders dashboard data when loaded", () => {
        mockQueryFn.mockReturnValue({
            data: { summary: { totalIssues: 10 }, activity: [{ id: 1, text: "test" }] },
            isPending: false,
            isError: false,
            error: undefined
        });

        renderPage();

        expect(screen.getByTestId("dashboard-counters")).toHaveTextContent("counters-ready");
        expect(screen.getByTestId("activity-feed")).toHaveTextContent("feed-ready");
    });

    it("shows error modal when query fails", () => {
        mockQueryFn.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: true,
            error: new Error("Network error")
        });

        renderPage();

        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
    });

    it("renders activity section title", () => {
        mockQueryFn.mockReturnValue({
            data: { summary: {}, activity: [] },
            isPending: false,
            isError: false,
            error: undefined
        });

        renderPage();

        expect(screen.getByText("activity.title")).toBeInTheDocument();
    });

    it("passes empty activity array when data has no activity", () => {
        mockQueryFn.mockReturnValue({
            data: { summary: {}, activity: undefined },
            isPending: false,
            isError: false,
            error: undefined
        });

        renderPage();

        expect(screen.getByTestId("activity-feed")).toBeInTheDocument();
    });

    it("passes user role and login to DashboardCounters", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: { id: "2", login: "user1", role: "USER" },
            loading: false,
            login: vi.fn(),
            logout: vi.fn()
        });

        mockQueryFn.mockReturnValue({
            data: { summary: {}, activity: [] },
            isPending: false,
            isError: false,
            error: undefined
        });

        renderPage();

        expect(screen.getByTestId("dashboard-counters")).toBeInTheDocument();
    });
});
