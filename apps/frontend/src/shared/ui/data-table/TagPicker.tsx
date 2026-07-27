/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import CaretRightIcon from "@helpdesk-portal/icons/CaretRight.svg?react";
import { Button, Checkbox } from "@helpdesk-portal/ui-kit";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./TagPicker.module.css";

export interface TagPickerOption {
    value: string;
    label: string;
}

interface TagPickerProps {
    options: TagPickerOption[];
    selected: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function TagPicker({ options, selected, onChange, placeholder = "Select...", className }: TagPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    }, []);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === "Escape") {
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, handleClickOutside, handleKeyDown]);

    const handleToggle = useCallback(
        (value: string) => {
            if (selected.includes(value)) {
                onChange(selected.filter(v => v !== value));
            } else {
                onChange([...selected, value]);
            }
        },
        [selected, onChange]
    );

    const triggerLabel = selected.length === 0 ? placeholder : `${selected.length} selected`;

    return (
        <div ref={containerRef} className={clsx(styles["tag-picker"], className)}>
            <Button
                variant="stroke"
                size="m"
                className={clsx(styles["tag-picker__trigger"], isOpen && styles["tag-picker__trigger--open"])}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                data-test="tag-picker-trigger"
            >
                <span className={styles["tag-picker__trigger-text"]}>{triggerLabel}</span>
                <span className={styles["tag-picker__arrow"]} data-test="tag-picker-arrow">
                    <CaretRightIcon
                        style={{ transform: isOpen ? "rotate(-90deg)" : "rotate(90deg)", display: "block" }}
                    />
                </span>
            </Button>

            {isOpen && (
                <div
                    className={styles["tag-picker__dropdown"]}
                    role="listbox"
                    aria-multiselectable="true"
                    data-test="tag-picker-dropdown"
                >
                    {options.map(option => {
                        const isChecked = selected.includes(option.value);
                        return (
                            <div
                                key={option.value}
                                className={clsx(
                                    styles["tag-picker__option"],
                                    isChecked && styles["tag-picker__option--selected"]
                                )}
                                data-test="tag-picker-option"
                            >
                                <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => handleToggle(option.value)}
                                    className={styles["tag-picker__checkbox"] ?? ""}
                                    data-test="tag-picker-checkbox"
                                />
                                <span className={styles["tag-picker__option-label"]}>{option.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
