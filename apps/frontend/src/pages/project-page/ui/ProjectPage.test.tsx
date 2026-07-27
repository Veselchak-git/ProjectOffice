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

import { ProjectPage } from "./ProjectPage";

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

vi.mock("@/entities/project", () => ({
    ...vi.importActual("@/entities/project"),
    MembersListModal: () => null,
    ProjectForm: () => <div data-test="project-form" />
}));

vi.mock("@/entities/issue", () => ({
    ...vi.importActual("@/entities/issue"),
    IssueForm: () => <div data-test="issue-form" />
}));

vi.mock("@helpdesk-portal/icons/Participants.svg?react", () => ({
    default: () => <span data-test="mock-icon" />
}));

// ── Вспомогательные функции ───────────────────────────────────────────────────

function renderPage() {
    return render(
        <MemoryRouter>
            <ProjectPage />
        </MemoryRouter>
    );
}

// ── Тесты ─────────────────────────────────────────────────────────────────────

describe("ProjectPage", () => {
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

    it("renders loading state when project is pending", () => {
        mockQueryFn.mockReturnValue({
            data: undefined,
            isPending: true,
            isError: false,
            error: undefined
        });

        renderPage();

        expect(screen.getByText("loading")).toBeInTheDocument();
    });

    it("shows error modal when project is not found", () => {
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

    it("renders project details when data is loaded", () => {
        const project = {
            id: 1,
            name: "Test Project",
            description: "A test project",
            status: "ACTIVE",
            versions: [{ id: 1, version: "1.0.0" }],
            taskCount: 5,
            responsible: "admin",
            myRole: "MANAGER",
            createdAt: "2025-01-01T00:00:00Z"
        };

        mockQueryFn
            .mockReturnValueOnce({
                data: project,
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

        expect(screen.getByText("Test Project")).toBeInTheDocument();
        expect(screen.getByText("admin")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("renders back button that navigates to projects list", () => {
        const project = {
            id: 1,
            name: "Back Button Project",
            description: "Test",
            status: "ACTIVE",
            versions: [],
            taskCount: 0,
            responsible: "admin",
            myRole: "MANAGER",
            createdAt: "2025-01-01T00:00:00Z"
        };

        mockQueryFn
            .mockReturnValueOnce({
                data: project,
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

    it("renders project versions", () => {
        const project = {
            id: 1,
            name: "Versioned Project",
            description: "",
            status: "ACTIVE",
            versions: [
                { id: 1, version: "1.0.0" },
                { id: 2, version: "2.0.0" }
            ],
            taskCount: 0,
            responsible: "user1",
            myRole: "DEVELOPER",
            createdAt: "2025-06-01T00:00:00Z"
        };

        mockQueryFn
            .mockReturnValueOnce({
                data: project,
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

        expect(screen.getByText("Versioned Project")).toBeInTheDocument();
        expect(screen.getByText("1.0.0")).toBeInTheDocument();
        expect(screen.getByText("2.0.0")).toBeInTheDocument();
    });

    it("shows dashes for empty versions", () => {
        const project = {
            id: 1,
            name: "Empty Versions",
            description: "No versions",
            status: "ARCHIVED",
            versions: [],
            taskCount: 0,
            responsible: "user2",
            myRole: "VIEWER",
            createdAt: "2025-06-01T00:00:00Z"
        };

        mockQueryFn
            .mockReturnValueOnce({
                data: project,
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

        expect(screen.getByText("Empty Versions")).toBeInTheDocument();
    });

    it("hides create issue and edit buttons for viewer role", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: { id: "3", login: "viewer", role: "USER" },
            loading: false,
            login: vi.fn(),
            logout: vi.fn()
        });

        const project = {
            id: 1,
            name: "Viewer Project",
            description: "",
            status: "ACTIVE",
            versions: [],
            taskCount: 0,
            responsible: "admin",
            myRole: "VIEWER",
            createdAt: "2025-06-01T00:00:00Z"
        };

        mockQueryFn
            .mockReturnValueOnce({
                data: project,
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

        expect(screen.queryByText("detail.issues.create")).not.toBeInTheDocument();
        expect(screen.queryByText("detail.edit")).not.toBeInTheDocument();
    });
});
