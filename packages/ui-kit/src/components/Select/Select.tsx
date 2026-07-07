import { Select as BaseSelect } from "@base-ui/react/select";
import clsx from "clsx";
import { type FC } from "react";

import type { ISelectProps } from "./types";

import "./Select.css";

export const Select: FC<ISelectProps> = ({
    className,
    color = "default",
    inputSize = "m",
    label,
    errorMessage,
    placeholder,
    value,
    defaultValue,
    options,
    disabled = false,
    startIcon,
    onValueChange
}) => {
    return (
        <BaseSelect.Root
            value={value}
            defaultValue={defaultValue}
            onValueChange={onValueChange}
            disabled={disabled}
        >
            <div
                className={clsx(
                    "ui-kit-select",
                    `ui-kit-select-color-${color}`,
                    `ui-kit-select-size-${inputSize}`,
                    color === "error" && "ui-kit-select-error",
                    disabled && "ui-kit-select-disabled",
                    className
                )}
            >
                {label ? (
                    <BaseSelect.Label className="ui-kit-select__label">
                        {label}
                    </BaseSelect.Label>
                ) : null}

                <BaseSelect.Trigger className="ui-kit-select__trigger">
                    {startIcon ? (
                        <span className="ui-kit-select__icon">{startIcon}</span>
                    ) : null}
                    <BaseSelect.Value
                        className="ui-kit-select__value"
                        placeholder={placeholder}
                    />
                    <BaseSelect.Icon
                        className="ui-kit-select__icon"
                        data-test="select-arrow"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M4 6L8 10L12 6"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </BaseSelect.Icon>
                </BaseSelect.Trigger>

                {errorMessage && color === "error" ? (
                    <span className="ui-kit-select__error">{errorMessage}</span>
                ) : null}
            </div>

            <BaseSelect.Portal>
                <BaseSelect.Positioner>
                    <BaseSelect.Popup className="ui-kit-select__popup">
                        <BaseSelect.List className="ui-kit-select__list">
                            {options.map((option) => (
                                <BaseSelect.Item
                                    key={option.value}
                                    value={option.value}
                                    className="ui-kit-select__item"
                                >
                                    {option.label}
                                </BaseSelect.Item>
                            ))}
                        </BaseSelect.List>
                    </BaseSelect.Popup>
                </BaseSelect.Positioner>
            </BaseSelect.Portal>
        </BaseSelect.Root>
    );
};
