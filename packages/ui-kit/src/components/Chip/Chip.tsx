import clsx from "clsx";
import { type FC } from "react";

import type { IChipProps } from "./types";

import "./Chip.css";

export const Chip: FC<IChipProps> = ({
    className,
    color = "accent",
    children,
    disabled = false,
    onRemove
}) => {
    return (
        <span
            className={clsx(
                "ui-kit-chip",
                `ui-kit-chip-color-${color}`,
                disabled && "ui-kit-chip-disabled",
                className
            )}
        >
            {children}
            {onRemove ? (
                <button
                    type="button"
                    className="ui-kit-chip__remove"
                    onClick={onRemove}
                    aria-label="Remove"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                            d="M1 1L9 9M9 1L1 9"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            ) : null}
        </span>
    );
};
