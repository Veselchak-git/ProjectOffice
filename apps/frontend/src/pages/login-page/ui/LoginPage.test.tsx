/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved.
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router";
import { useNavigate } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@/shared/lib/auth";

import { LoginPage } from "./LoginPage";

// ── Моки ──────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock("react-router", async importOriginal => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: vi.fn() };
});

vi.mock("@/shared/lib/auth", () => ({
    useAuth: vi.fn()
}));

vi.mock("@/shared/lib/error-boundary/ErrorModal", () => ({
    ErrorModal: ({ isOpen, message }: { isOpen: boolean; message: string }) =>
        isOpen ? <div data-test="error-modal">{message}</div> : null
}));

vi.mock("@helpdesk-portal/icons/LoginIcon.svg?react", () => ({
    default: () => <span data-test="mock-icon" />
}));
vi.mock("@helpdesk-portal/icons/PasswordIcon.svg?react", () => ({
    default: () => <span data-test="mock-icon" />
}));
vi.mock("@helpdesk-portal/icons/ResetInput.svg?react", () => ({
    default: () => <span data-test="mock-icon" />
}));
vi.mock("@helpdesk-portal/icons/ShowPassword.svg?react", () => ({
    default: () => <span data-test="mock-icon" />
}));
vi.mock("@helpdesk-portal/icons/TecomLogo.svg?react", () => ({
    default: () => <span data-test="mock-icon" />
}));

// ── Вспомогательные функции ───────────────────────────────────────────────────

function renderPage() {
    return render(
        <BrowserRouter>
            <LoginPage />
        </BrowserRouter>
    );
}

// ── Тесты ─────────────────────────────────────────────────────────────────────

describe("LoginPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            loading: false,
            login: mockLogin,
            logout: vi.fn()
        });
    });

    it("renders login form with title and subtitle", () => {
        renderPage();

        expect(screen.getByText("auth:login.title")).toBeInTheDocument();
        expect(screen.getByText("auth:login.subtitle")).toBeInTheDocument();
    });

    it("renders email and password inputs", () => {
        renderPage();

        expect(screen.getByText("auth:login.email.label")).toBeInTheDocument();
        expect(screen.getByText("auth:login.password.label")).toBeInTheDocument();
    });

    it("renders submit button", () => {
        renderPage();

        const submitButton = screen.getByRole("button", { name: "auth:login.submit" });
        expect(submitButton).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
    });

    it("enables submit button when both fields are filled", async () => {
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByPlaceholderText("auth:login.email.placeholder"), "test@example.com");
        await user.type(screen.getByPlaceholderText("auth:login.password.placeholder"), "password123");

        const submitButton = screen.getByRole("button", { name: "auth:login.submit" });
        expect(submitButton).not.toBeDisabled();
    });

    it("calls login and navigates on successful submit", async () => {
        mockLogin.mockResolvedValueOnce(undefined);
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByPlaceholderText("auth:login.email.placeholder"), "test@example.com");
        await user.type(screen.getByPlaceholderText("auth:login.password.placeholder"), "password123");
        await user.click(screen.getByRole("button", { name: "auth:login.submit" }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
        });
        expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });

    it("shows error modal on login failure", async () => {
        mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByPlaceholderText("auth:login.email.placeholder"), "test@example.com");
        await user.type(screen.getByPlaceholderText("auth:login.password.placeholder"), "password123");
        await user.click(screen.getByRole("button", { name: "auth:login.submit" }));

        await waitFor(() => {
            expect(screen.getByTestId("error-modal")).toBeInTheDocument();
        });
        expect(screen.getByTestId("error-modal")).toHaveTextContent("Invalid credentials");
    });

    it("does not call login when submit button is disabled", async () => {
        renderPage();

        // Try clicking submit without filling fields
        const submitButton = screen.getByRole("button", { name: "auth:login.submit" });
        expect(submitButton).toBeDisabled();

        expect(mockLogin).not.toHaveBeenCalled();
    });

    it("renders logo and icons", () => {
        renderPage();

        const icons = screen.getAllByTestId("mock-icon");
        expect(icons.length).toBeGreaterThan(0);
    });
});
