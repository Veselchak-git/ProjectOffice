import clsx from "clsx";
import { type FC, useCallback, useEffect, useRef } from "react";

import "./Modal.css";
import type { IModalProps } from "./types";

const CLOSE_SVG = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M12 4L4 12M4 4l8 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const Modal: FC<IModalProps> = ({ isOpen, onClose, title, children, size = "m", className }) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    useEffect(() => {
        if (isOpen && dialogRef.current) {
            const focusable = dialogRef.current.querySelector<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            focusable?.focus();
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className={clsx("ui-kit-modal", `ui-kit-modal--${size}`, className)} onClick={onClose} role="presentation">
            <div
                ref={dialogRef}
                className="ui-kit-modal__dialog"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={e => e.stopPropagation()}
            >
                {title ? (
                    <div className="ui-kit-modal__header">
                        <h2 className="ui-kit-modal__title">{title}</h2>
                        <button type="button" className="ui-kit-modal__close" onClick={onClose} aria-label="Закрыть">
                            {CLOSE_SVG}
                        </button>
                    </div>
                ) : null}
                {children}
            </div>
        </div>
    );
};
