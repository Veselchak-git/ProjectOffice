import clsx from "clsx";
import { type FC } from "react";

import type { IContextItemProps } from "./types";

import "./ContextItem.css";

export const ContextItem: FC<IContextItemProps> = ({
    className,
    label,
    icon,
    endIcon,
    disabled = false,
    onClick
}) => {
    return (
        <button
            type="button"
            className={clsx(
                "ui-kit-context-item",
                disabled && "ui-kit-context-item-disabled",
                className
            )}
            disabled={disabled}
            onClick={onClick}
        >
            {icon ? <span className="ui-kit-context-item__icon">{icon}</span> : null}
            <span className="ui-kit-context-item__label">{label}</span>
            {endIcon ? (
                <span className="ui-kit-context-item__end-icon">{endIcon}</span>
            ) : null}
        </button>
    );
};
