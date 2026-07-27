/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Select } from "@base-ui/react/select";
import clsx from "clsx";
import { type FC } from "react";

import "./MultiSelect.css";
import type { IMultiSelectProps } from "./types";

export const MultiSelect: FC<IMultiSelectProps> = ({
    className,
    options,
    selected,
    onChange,
    placeholder = "Select...",
    disabled = false,
    usePortal = true
}) => {
    return (
        <Select.Root
            multiple={true}
            value={selected}
            onValueChange={values => {
                onChange(values);
            }}
            disabled={disabled}
        >
            <div className={clsx("multi-select", className)}>
                <Select.Trigger className="multi-select__trigger" data-test="multi-select-trigger">
                    <span className="multi-select__placeholder">{placeholder}</span>
                    <Select.Icon className="multi-select__arrow">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M4 6L8 10L12 6"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </Select.Icon>
                </Select.Trigger>
            </div>

            {usePortal ? (
                <Select.Portal>
                    <Select.Positioner className="multi-select__positioner">
                        <Select.Popup className="multi-select__popup" data-test="multi-select-dropdown">
                            <Select.List className="multi-select__list">
                                {options.map(option => (
                                    <Select.Item
                                        key={option.value}
                                        value={option.value}
                                        className="multi-select__item"
                                        data-test="multi-select-option"
                                    >
                                        <Select.ItemIndicator
                                            className="multi-select__item-indicator"
                                            keepMounted
                                            data-test="multi-select-checkbox"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <rect
                                                    className="multi-select__indicator-box"
                                                    x="1"
                                                    y="1"
                                                    width="14"
                                                    height="14"
                                                    rx="3"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    fill="none"
                                                />
                                                <path
                                                    className="multi-select__indicator-check"
                                                    d="M4 8L7 11L12 5"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </Select.ItemIndicator>
                                        <span className="multi-select__item-label">{option.label}</span>
                                    </Select.Item>
                                ))}
                            </Select.List>
                        </Select.Popup>
                    </Select.Positioner>
                </Select.Portal>
            ) : (
                <Select.Positioner className="multi-select__positioner">
                    <Select.Popup className="multi-select__popup" data-test="multi-select-dropdown">
                        <Select.List className="multi-select__list">
                            {options.map(option => (
                                <Select.Item
                                    key={option.value}
                                    value={option.value}
                                    className="multi-select__item"
                                    data-test="multi-select-option"
                                >
                                    <Select.ItemIndicator
                                        className="multi-select__item-indicator"
                                        keepMounted
                                        data-test="multi-select-checkbox"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <rect
                                                className="multi-select__indicator-box"
                                                x="1"
                                                y="1"
                                                width="14"
                                                height="14"
                                                rx="3"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                fill="none"
                                            />
                                            <path
                                                className="multi-select__indicator-check"
                                                d="M4 8L7 11L12 5"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </Select.ItemIndicator>
                                    <span className="multi-select__item-label">{option.label}</span>
                                </Select.Item>
                            ))}
                        </Select.List>
                    </Select.Popup>
                </Select.Positioner>
            )}
        </Select.Root>
    );
};
