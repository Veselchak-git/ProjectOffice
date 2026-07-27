/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved.
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfilePage } from "./ProfilePage";

// ── Моки ──────────────────────────────────────────────────────────────────────

const mockChangePassword = vi.fn();

vi.mock("../api/changePassword", () => ({
    changePasswordRequest: (...args: unknown[]) => mockChangePassword(...args)
}));

vi.mock("@/shared/lib/error-boundary/ErrorModal", () => ({
    ErrorModal: ({ isOpen, message }: { isOpen: boolean; message: string }) =>
        isOpen ? <div data-test="error-modal">{message}</div> : null
}));

vi.mock("@helpdesk-portal/icons/AvatarPlaceholder.svg?react", () => ({
    default: () => <span data-test="mock-icon" />
}));
vi.mock("@helpdesk-portal/icons/PasswordIcon.svg?react", () => ({
    default: () => <span data-test="mock-icon" />
}));
vi.mock("@helpdesk-portal/icons/ResetInput.svg?react", () => ({
    default: () => <span data-test="mock-icon" />
}));

// ── Тесты ─────────────────────────────────────────────────────────────────────

describe("ProfilePage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders profile title and form", () => {
        render(<ProfilePage />);

        expect(screen.getByText("auth:profile.title")).toBeInTheDocument();
        expect(screen.getByText("auth:profile.currentPassword.label")).toBeInTheDocument();
        expect(screen.getByText("auth:profile.newPassword.label")).toBeInTheDocument();
        expect(screen.getByText("auth:profile.confirmPassword.label")).toBeInTheDocument();
    });

    it("renders submit button in disabled state initially", () => {
        render(<ProfilePage />);

        const submitButton = screen.getByRole("button", { name: "auth:profile.submit" });
        expect(submitButton).toBeDisabled();
    });

    it("renders user icon", () => {
        render(<ProfilePage />);

        const icons = screen.getAllByTestId("mock-icon");
        expect(icons.length).toBeGreaterThan(0);
    });

    it("renders show passwords toggle", () => {
        render(<ProfilePage />);

        expect(screen.getByText("auth:profile.showPasswords")).toBeInTheDocument();
    });

    it("renders success message after successful password change", async () => {
        mockChangePassword.mockResolvedValueOnce(undefined);
        const user = userEvent.setup();
        render(<ProfilePage />);

        await user.type(screen.getByPlaceholderText("auth:profile.currentPassword.placeholder"), "oldPass123");
        await user.type(screen.getByPlaceholderText("auth:profile.newPassword.placeholder"), "newPass123");
        await user.type(screen.getByPlaceholderText("auth:profile.confirmPassword.placeholder"), "newPass123");
        await user.click(screen.getByRole("button", { name: "auth:profile.submit" }));

        await vi.waitFor(() => {
            expect(screen.getByText("auth:profile.success")).toBeInTheDocument();
        });
        expect(mockChangePassword).toHaveBeenCalled();
    });

    it("shows error modal on password change failure", async () => {
        mockChangePassword.mockRejectedValueOnce(new Error("Old password incorrect"));
        const user = userEvent.setup();
        render(<ProfilePage />);

        await user.type(screen.getByPlaceholderText("auth:profile.currentPassword.placeholder"), "oldPass123");
        await user.type(screen.getByPlaceholderText("auth:profile.newPassword.placeholder"), "newPass123");
        await user.type(screen.getByPlaceholderText("auth:profile.confirmPassword.placeholder"), "newPass123");
        await user.click(screen.getByRole("button", { name: "auth:profile.submit" }));

        await vi.waitFor(() => {
            expect(screen.getByTestId("error-modal")).toBeInTheDocument();
        });
        expect(screen.getByTestId("error-modal")).toHaveTextContent("Old password incorrect");
    });

    it("disables submit button when not all fields are filled", async () => {
        const user = userEvent.setup();
        render(<ProfilePage />);

        await user.type(screen.getByPlaceholderText("auth:profile.currentPassword.placeholder"), "pass123");

        const submitButton = screen.getByRole("button", { name: "auth:profile.submit" });
        expect(submitButton).toBeDisabled();
    });
});
