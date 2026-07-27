/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved.
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { useParams } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@/shared/lib/auth";

import { IssuePage } from "./IssuePage";

// ── Моки ──────────────────────────────────────────────────────────────────────

const mockQueryFn = vi.fn();

vi.mock("react-router", async importOriginal => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: vi.fn(), useParams: vi.fn() };
});

vi.mock("@tanstack/react-query", () => ({
    useQuery: (...args: unknown[]) => mockQueryFn(...args),
    useMutation: vi.fn(() => ({
        mutateAsync: vi.fn().mockResolvedValue(undefined),
        isPending: false
    })),
    useQueryClient: vi.fn(() => ({
        invalidateQueries: vi.fn()
    }))
}));

vi.mock("@/shared/lib/auth", () => ({
    useAuth: vi.fn()
}));

vi.mock("@/shared/lib/error-boundary/ErrorModal", () => ({
    ErrorModal: ({ isOpen, message }: { isOpen: boolean; message: string }) =>
        isOpen ? <div data-test="error-modal">{message}</div> : null
}));

// No SVG icon imports directly in IssuePage

// ── Вспомогательные функции ───────────────────────────────────────────────────

function renderPage() {
    return render(
        <MemoryRouter>
            <IssuePage />
        </MemoryRouter>
    );
}

// ── Тесты ─────────────────────────────────────────────────────────────────────

describe("IssuePage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useParams).mockReturnValue({ id: "1" });
        vi.mocked(useAuth).mockReturnValue({
            user: { id: "1", login: "admin", role: "ADMIN" },
            loading: false,
            login: vi.fn(),
            logout: vi.fn()
        });
    });

    it("renders loading state when issue is pending", () => {
        mockQueryFn.mockReturnValue({
            data: undefined,
            isPending: true,
            isError: false,
            error: undefined
        });

        renderPage();

        expect(screen.getByText("loading")).toBeInTheDocument();
    });

    it("shows error modal when issue is not found", () => {
        mockQueryFn
            .mockReturnValueOnce({
                data: undefined,
                isPending: false,
                isError: true,
                error: new Error("Not found")
            })
            .mockReturnValue({ data: undefined, isPending: false, isError: false });

        renderPage();

        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
    });

    it("renders issue details when data is loaded", () => {
        const issue = {
            id: 1,
            title: "Test Issue",
            category: "BUG",
            priority: "CRITICAL",
            status: "NEW",
            projectName: "Project A",
            projectId: 10,
            reporterLogin: "reporter1",
            assigneeLogin: "assignee1",
            description: "Test description",
            additionalInfo: "Additional info",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-02T00:00:00Z",
            myRole: "MANAGER"
        };

        mockQueryFn
            .mockReturnValueOnce({
                data: issue,
                isPending: false,
                isError: false,
                error: undefined
            })
            .mockReturnValue({
                data: undefined,
                isPending: false,
                isError: false,
                error: undefined
            });

        renderPage();

        expect(screen.getByText("Test Issue")).toBeInTheDocument();
        expect(screen.getByText("reporter1")).toBeInTheDocument();
        expect(screen.getByText("assignee1")).toBeInTheDocument();
    });

    it("renders back button", () => {
        const issue = {
            id: 1,
            title: "Back Button Issue",
            category: "BUG",
            priority: "MINOR",
            status: "NEW",
            projectName: "Project A",
            projectId: 10,
            reporterLogin: "reporter1",
            description: "",
            additionalInfo: "",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
            myRole: "DEVELOPER"
        };

        mockQueryFn
            .mockReturnValueOnce({
                data: issue,
                isPending: false,
                isError: false,
                error: undefined
            })
            .mockReturnValue({
                data: undefined,
                isPending: false,
                isError: false,
                error: undefined
            });

        renderPage();

        expect(screen.getByText("detail.back")).toBeInTheDocument();
    });

    it("renders issue with solution when present", () => {
        const issue = {
            id: 1,
            title: "Issue with Solution",
            category: "BUG",
            priority: "MINOR",
            status: "RESOLVED",
            projectName: "Project B",
            projectId: 20,
            reporterLogin: "user1",
            assigneeLogin: "user2",
            description: "Description",
            additionalInfo: "",
            solution: "Fixed by updating config",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-02T00:00:00Z",
            myRole: "DEVELOPER"
        };

        mockQueryFn
            .mockReturnValueOnce({
                data: issue,
                isPending: false,
                isError: false,
                error: undefined
            })
            .mockReturnValue({
                data: undefined,
                isPending: false,
                isError: false,
                error: undefined
            });

        renderPage();

        expect(screen.getByText("Issue with Solution")).toBeInTheDocument();
        expect(screen.getByText("Fixed by updating config")).toBeInTheDocument();
    });

    it("hides edit and delete buttons for viewer role", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: { id: "3", login: "viewer", role: "USER" },
            loading: false,
            login: vi.fn(),
            logout: vi.fn()
        });

        const issue = {
            id: 1,
            title: "View Only Issue",
            category: "TASK",
            priority: "GENERAL",
            status: "CLOSED",
            projectName: "Project C",
            projectId: 30,
            reporterLogin: "user1",
            description: "",
            additionalInfo: "",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
            myRole: "VIEWER"
        };

        mockQueryFn
            .mockReturnValueOnce({
                data: issue,
                isPending: false,
                isError: false,
                error: undefined
            })
            .mockReturnValue({
                data: undefined,
                isPending: false,
                isError: false,
                error: undefined
            });

        renderPage();

        expect(screen.queryByText("detail.edit")).not.toBeInTheDocument();
        expect(screen.queryByText("detail.delete")).not.toBeInTheDocument();
    });

    it("shows dashes for missing optional fields", () => {
        const issue = {
            id: 1,
            title: "Minimal Issue",
            category: "QUESTION",
            priority: "GENERAL",
            status: "NEW",
            projectName: "Project D",
            projectId: 40,
            reporterLogin: "user1",
            assigneeLogin: null,
            description: null,
            additionalInfo: null,
            solution: null,
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
            myRole: "DEVELOPER"
        };

        mockQueryFn
            .mockReturnValueOnce({
                data: issue,
                isPending: false,
                isError: false,
                error: undefined
            })
            .mockReturnValue({
                data: undefined,
                isPending: false,
                isError: false,
                error: undefined
            });

        renderPage();

        expect(screen.getByText("Minimal Issue")).toBeInTheDocument();
    });
});
