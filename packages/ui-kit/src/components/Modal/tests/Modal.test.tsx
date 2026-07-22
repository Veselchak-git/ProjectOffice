import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "../Modal";

describe("Modal", () => {
    it("renders children when isOpen is true", () => {
        render(
            <Modal isOpen onClose={vi.fn()}>
                <p>Modal content</p>
            </Modal>
        );

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Modal content")).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
        render(
            <Modal isOpen={false} onClose={vi.fn()}>
                <p>Modal content</p>
            </Modal>
        );

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.queryByText("Modal content")).not.toBeInTheDocument();
    });

    it("closes on Escape key press", () => {
        const onClose = vi.fn();

        render(
            <Modal isOpen onClose={onClose}>
                <p>Content</p>
            </Modal>
        );

        fireEvent.keyDown(document, { key: "Escape" });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes on overlay click", () => {
        const onClose = vi.fn();

        render(
            <Modal isOpen onClose={onClose}>
                <p>Content</p>
            </Modal>
        );

        const overlay = screen.getByRole("presentation");

        fireEvent.click(overlay);

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not close when clicking inside the dialog", () => {
        const onClose = vi.fn();

        render(
            <Modal isOpen onClose={onClose}>
                <p>Content</p>
            </Modal>
        );

        fireEvent.click(screen.getByRole("dialog"));

        expect(onClose).not.toHaveBeenCalled();
    });

    it("renders title when provided", () => {
        render(
            <Modal isOpen onClose={vi.fn()} title="My Modal">
                <p>Content</p>
            </Modal>
        );

        expect(screen.getByRole("dialog", { name: "My Modal" })).toBeInTheDocument();
        expect(screen.getByText("My Modal")).toBeInTheDocument();
    });

    it("renders without header when title is not provided", () => {
        render(
            <Modal isOpen onClose={vi.fn()}>
                <p>Content</p>
            </Modal>
        );

        expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-label");
        expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });

    it("applies size modifier class", () => {
        render(
            <Modal isOpen onClose={vi.fn()} size="l">
                <p>Content</p>
            </Modal>
        );

        expect(screen.getByRole("presentation")).toHaveClass("ui-kit-modal--l");
    });
});
