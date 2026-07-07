/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Button as BaseButton } from "@base-ui/react/button";
import clsx from "clsx";
import type { ButtonHTMLAttributes, FC, ReactNode } from "react";

import "./Button.css";

export type ButtonColor = "accent" | "error";
export type ButtonVariant = "fill" | "stroke" | "link";
export type ButtonSize = "s" | "m" | "l" | "xl";

export interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    color?: ButtonColor;
    variant?: ButtonVariant;
    size?: ButtonSize;
    iconOnly?: boolean;
    startIcon?: ReactNode;
    endIcon?: ReactNode;
    children?: ReactNode;
}

const LINK_SIZES: ButtonSize[] = ["m", "l", "xl"];

export const Button: FC<IButtonProps> = ({
    children,
    className,
    color = "accent",
    variant = "fill",
    size = "m",
    iconOnly = false,
    startIcon,
    endIcon,
    type = "button",
    ...props
}) => {
    const resolvedSize = variant === "link" && !LINK_SIZES.includes(size) ? "m" : size;

    return (
        <BaseButton
            {...props}
            type={type}
            className={clsx(
                "ui-kit-btn",
                `ui-kit-btn-${variant}`,
                `ui-kit-btn-${color}`,
                `ui-kit-btn-size-${resolvedSize}`,
                iconOnly && "ui-kit-btn-icon-only",
                className
            )}
        >
            {startIcon ? <span className="ui-kit-btn__icon">{startIcon}</span> : null}
            {!iconOnly && children ? <span className="ui-kit-btn__label">{children}</span> : null}
            {iconOnly ? children : null}
            {endIcon ? <span className="ui-kit-btn__icon">{endIcon}</span> : null}
        </BaseButton>
    );
};
