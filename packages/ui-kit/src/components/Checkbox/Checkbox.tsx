import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import clsx from "clsx";
import { type FC } from "react";

import type { ICheckboxProps } from "./types";

import "./Checkbox.css";

export const Checkbox: FC<ICheckboxProps> = ({
    className,
    inputSize = "m",
    label,
    checked,
    defaultChecked,
    indeterminate = false,
    disabled = false,
    onCheckedChange
}) => {
    const checkbox = (
        <BaseCheckbox.Root
            className={clsx(
                "ui-kit-checkbox",
                `ui-kit-checkbox-size-${inputSize}`,
                !label && className
            )}
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            onCheckedChange={onCheckedChange}
        >
            <BaseCheckbox.Indicator className="ui-kit-checkbox__indicator">
                {indeterminate ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <rect x="2" y="5" width="8" height="2" rx="1" fill="currentColor" />
                    </svg>
                ) : (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                            d="M2.5 6L5 8.5L9.5 3.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </BaseCheckbox.Indicator>

            {label ? (
                <span className="ui-kit-checkbox__label">{label}</span>
            ) : null}
        </BaseCheckbox.Root>
    );

    return checkbox;
};
