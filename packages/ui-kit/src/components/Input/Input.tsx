import { Input as BaseInput } from "@base-ui/react/input";
import clsx from "clsx";
import { type FC, useState, useCallback } from "react";

import type { IInputProps } from "./types";

import "./Input.css";

export const Input: FC<IInputProps> = ({
    className,
    color = "default",
    inputSize = "m",
    label,
    errorMessage,
    startIcon,
    endIcon,
    filled = false,
    disabled = false,
    placeholder,
    onFocus,
    onBlur,
    ...props
}) => {
    const [focused, setFocused] = useState(false);

    const handleFocus = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            setFocused(true);
            onFocus?.(e);
        },
        [onFocus]
    );

    const handleBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            setFocused(false);
            onBlur?.(e);
        },
        [onBlur]
    );

    return (
        <div
            className={clsx(
                "ui-kit-input",
                `ui-kit-input-color-${color}`,
                `ui-kit-input-size-${inputSize}`,
                focused && "ui-kit-input-focused",
                color === "error" && "ui-kit-input-error",
                disabled && "ui-kit-input-disabled",
                filled && "ui-kit-input-filled",
                className
            )}
        >
            {label ? <span className="ui-kit-input__label">{label}</span> : null}
            <div className="ui-kit-input__field">
                {startIcon ? <span className="ui-kit-input__icon">{startIcon}</span> : null}
                <BaseInput
                    {...props}
                    disabled={disabled}
                    placeholder={placeholder}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="ui-kit-input__native"
                />
                {endIcon ? <span className="ui-kit-input__icon">{endIcon}</span> : null}
            </div>
            {errorMessage && color === "error" ? (
                <span className="ui-kit-input__error">{errorMessage}</span>
            ) : null}
        </div>
    );
};
