import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorModal } from "./ErrorModal";

const mockNavigate = vi.fn();

vi.mock("react-router", () => ({
    useNavigate: () => mockNavigate
}));

vi.mock("@helpdesk-portal/icons/Error.svg?react", () => ({
    default: (props: React.SVGProps<SVGSVGElement>) => <svg data-test="error-icon" {...props} />
}));

vi.mock("@helpdesk-portal/ui-kit", () => ({
    Modal: ({
        isOpen,
        onClose,
        title,
        children
    }: {
        isOpen: boolean;
        onClose: () => void;
        title: string;
        children: React.ReactNode;
    }) =>
        isOpen ? (
            <div data-test="modal">
                <h2 data-test="modal-title">{title}</h2>
                <button data-test="modal-close" onClick={onClose} />
                {children}
            </div>
        ) : null,
    Button: ({
        onClick,
        className,
        children
    }: {
        onClick?: () => void;
        className?: string;
        children: React.ReactNode;
    }) => (
        <button data-test="ok-button" className={className} onClick={onClick}>
            {children}
        </button>
    )
}));

describe("ErrorModal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("не рендерит модалку когда isOpen = false", () => {
        render(<ErrorModal isOpen={false} message="Ошибка" onClose={vi.fn()} />);

        expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    it("рендерит модалку с заголовком и сообщением когда isOpen = true", () => {
        render(<ErrorModal isOpen={true} message="Что-то пошло не так" onClose={vi.fn()} />);

        expect(screen.getByTestId("modal")).toBeInTheDocument();
        expect(screen.getByTestId("modal-title")).toHaveTextContent("error.title");
        expect(screen.getByText("Что-то пошло не так")).toBeInTheDocument();
    });

    it("рендерит иконку ошибки", () => {
        render(<ErrorModal isOpen={true} message="Ошибка" onClose={vi.fn()} />);

        expect(screen.getByTestId("error-icon")).toBeInTheDocument();
    });

    it("вызывает onClose при нажатии OK", async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        render(<ErrorModal isOpen={true} message="Ошибка" onClose={onClose} />);

        await user.click(screen.getByTestId("ok-button"));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("не вызывает navigate когда onOkNavigate не задан", async () => {
        const user = userEvent.setup();

        render(<ErrorModal isOpen={true} message="Ошибка" onClose={vi.fn()} />);

        await user.click(screen.getByTestId("ok-button"));

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("вызывает navigate и onClose когда onOkNavigate задан", async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        render(<ErrorModal isOpen={true} message="Ошибка" onClose={onClose} onOkNavigate="/home" />);

        await user.click(screen.getByTestId("ok-button"));

        expect(mockNavigate).toHaveBeenCalledWith("/home");
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("вызывает onClose при закрытии модалки через крестик", async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        render(<ErrorModal isOpen={true} message="Ошибка" onClose={onClose} />);

        await user.click(screen.getByTestId("modal-close"));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
