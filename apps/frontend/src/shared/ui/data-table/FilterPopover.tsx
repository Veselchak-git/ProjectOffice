/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import FilterIcon from "@helpdesk-portal/icons/Filter.svg?react";
import { Button, Input, MultiSelect, Select } from "@helpdesk-portal/ui-kit";
import clsx from "clsx";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { DateTimePicker } from "@/shared/ui/date-time-picker/DateTimePicker";

import { getOperatorsForFieldType, getValueInputType } from "../../lib/use-table-filter/operator-helpers";
import type { FieldOption, FilterCondition, FilterOperator } from "../../lib/use-table-filter/types";
import styles from "./FilterPopover.module.css";

const POPOVER_WIDTH = 470;

export interface FilterPopoverProps {
    fields: FieldOption[];
    conditions: FilterCondition[];
    logic: "AND" | "OR";
    initialField?: string;
    onApply: (conditions: FilterCondition[], logic: "AND" | "OR") => void;
    onReset: () => void;
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

function generateId(): string {
    return Math.random().toString(36).slice(2, 10);
}

/**
 * Outer wrapper — handles viewport positioning, outside-click and Escape dismissal.
 * Renders the inner content ONLY when isOpen is true, so FilterPopoverContent
 * gets fresh state initialized from props on each open (no reset-effect needed).
 */
export function FilterPopover({
    fields,
    conditions,
    logic,
    initialField,
    onApply,
    onReset,
    isOpen,
    onClose,
    className
}: FilterPopoverProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Detect whether the popover would overflow the viewport on the right side.
    useLayoutEffect(() => {
        const el = containerRef.current;
        const parent = el?.parentElement;
        if (!parent) return;
        const parentRect = parent.getBoundingClientRect();
        if (parentRect.right + POPOVER_WIDTH > window.innerWidth) {
            el.classList.add(styles["popover--right"] ?? "");
        }
    }, []);

    // Guard: suppress mousedown that immediately follows popover mount.
    const justOpenedRef = useRef(true);
    useEffect(() => {
        justOpenedRef.current = true;
        const id = setTimeout(() => {
            justOpenedRef.current = false;
        }, 0);
        return () => clearTimeout(id);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handleMouseDown = (event: MouseEvent) => {
            if (justOpenedRef.current) return;
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleMouseDown);
        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, [onClose]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className={clsx(styles.popover, className)}
            data-test="filter-popover"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
        >
            <FilterPopoverContent
                fields={fields}
                conditions={conditions}
                logic={logic}
                initialField={initialField}
                onApply={onApply}
                onReset={onReset}
            />
        </div>
    );
}

// ─── Inner content ───────────────────────────────────────────────────────────
// Rendered only when FilterPopover's isOpen is true. Mounts with fresh state
// initialised from props via useMemo — no reset-useEffect required.

interface ContentProps {
    fields: FieldOption[];
    conditions: FilterCondition[];
    logic: "AND" | "OR";
    initialField: string | undefined;
    onApply: (conditions: FilterCondition[], logic: "AND" | "OR") => void;
    onReset: () => void;
}

function FilterPopoverContent({ fields, conditions: allConditions, initialField, onApply, onReset }: ContentProps) {
    const { t } = useTranslation("common");

    // ── Filter only conditions matching this column ────────────────────
    const fieldConditions = useMemo(
        () =>
            allConditions.filter(c => (initialField ? c.field === initialField : c.field === allConditions[0]?.field)),
        [allConditions, initialField]
    );
    const ownCondition = fieldConditions[0];

    // ── Initial values (recomputed via useMemo when props change) ──────
    const initialFieldValue = initialField ?? ownCondition?.field ?? "";
    const initialOperatorValue: FilterOperator =
        ownCondition?.operator ??
        (() => {
            if (initialField) {
                const fieldOpt = fields.find(fo => fo.field === initialField);
                const ops = fieldOpt ? getOperatorsForFieldType(fieldOpt.type) : [];
                return (ops[0]?.value as FilterOperator) ?? "contains";
            }
            return "contains";
        })();
    const initialValueValue = ownCondition?.value ?? "";

    // ── Local editing state ────────────────────────────────────────────
    const [fieldValue, setFieldValue] = useState<string>(initialFieldValue);
    const [operatorValue, setOperatorValue] = useState<FilterOperator>(initialOperatorValue);
    const [valueValue, setValueValue] = useState<string | string[]>(initialValueValue);

    // ── Handlers (no useCallback — React Compiler manages memoisation) ─

    const handleFieldChange = (newField: string) => {
        setFieldValue(newField);

        const fieldOption = fields.find(f => f.field === newField);
        if (fieldOption) {
            const operators = getOperatorsForFieldType(fieldOption.type);
            const firstOperator = operators[0]?.value ?? "contains";
            setOperatorValue(firstOperator);
        }

        setValueValue("");
    };

    const handleOperatorChange = (newOperator: FilterOperator) => {
        const prevType = getValueInputType(operatorValue);
        const newType = getValueInputType(newOperator);

        setOperatorValue(newOperator);

        if (prevType !== newType) {
            setValueValue(newType === "multiselect" ? [] : "");
        }
    };

    const handleValueChange = (newValue: string | string[]) => {
        setValueValue(newValue);
    };

    const handleApply = useCallback(() => {
        const conditionField = initialField ?? fieldValue;

        // Keep conditions for other fields, replace/remove for this field
        const otherConditions = allConditions.filter(c => c.field !== conditionField);
        const merged = fieldValue
            ? [...otherConditions, { id: generateId(), field: fieldValue, operator: operatorValue, value: valueValue }]
            : otherConditions;

        onApply(merged, "AND");
    }, [fieldValue, operatorValue, valueValue, onApply, allConditions, initialField]);

    const handleReset = () => {
        setFieldValue(initialField ?? "");
        const defaultOp = (() => {
            if (initialField) {
                const fieldOpt = fields.find(fo => fo.field === initialField);
                const ops = fieldOpt ? getOperatorsForFieldType(fieldOpt.type) : [];
                return (ops[0]?.value as FilterOperator) ?? "contains";
            }
            return "contains" as FilterOperator;
        })();
        setOperatorValue(defaultOp);
        setValueValue("");
        onReset();
    };

    // ── Render helpers ─────────────────────────────────────────────────
    const renderValueInput = () => {
        const fieldOption = fields.find(f => f.field === fieldValue);
        const inputType = getValueInputType(operatorValue);

        if (inputType === "multiselect" && fieldOption?.enumValues) {
            const selected = Array.isArray(valueValue) ? valueValue : [];
            return (
                <MultiSelect
                    options={fieldOption.enumValues}
                    selected={selected}
                    onChange={values => handleValueChange(values)}
                    placeholder={
                        selected.length > 0
                            ? t("filter.selectedCount", { count: selected.length })
                            : t("filter.placeholder.select")
                    }
                    usePortal={false}
                    className={styles.fieldSelect ?? ""}
                />
            );
        }

        if (inputType === "date") {
            return (
                <DateTimePicker
                    value={typeof valueValue === "string" ? valueValue : ""}
                    onChange={v => handleValueChange(v)}
                />
            );
        }

        return (
            <Input
                type="text"
                className={styles.valueInput}
                placeholder={t("filter.placeholder.value")}
                value={typeof valueValue === "string" ? valueValue : ""}
                onChange={e => handleValueChange(e.target.value)}
                data-test="filter-value-0"
            />
        );
    };

    const isFixedField = initialField != null;
    const fieldOption = fields.find(f => f.field === fieldValue);
    const operators = fieldOption ? getOperatorsForFieldType(fieldOption.type) : getOperatorsForFieldType("text");

    // ── Render ─────────────────────────────────────────────────────────
    return (
        <>
            <div className={styles.title} data-test="filter-popover-title">
                <FilterIcon />
                {t("filter.title")}
            </div>

            <div className={styles.row} data-test="filter-row-0">
                {isFixedField ? (
                    <span className={styles.fieldLabel} data-test="filter-field-label-0">
                        {fieldOption?.label ?? initialField}
                    </span>
                ) : (
                    <Select
                        className={styles.fieldSelect ?? ""}
                        placeholder={t("filter.placeholder.select")}
                        options={fields.map(field => ({ value: field.field, label: field.label }))}
                        value={fieldValue}
                        onValueChange={handleFieldChange}
                        usePortal={false}
                        data-test="filter-field-0"
                    />
                )}

                <Select
                    className={styles.fieldSelect ?? ""}
                    placeholder={t("filter.placeholder.select")}
                    options={operators.map(op => ({ value: op.value, label: t(`filter.operator.${op.value}`) }))}
                    value={operatorValue}
                    onValueChange={value => handleOperatorChange(value as FilterOperator)}
                    usePortal={false}
                    data-test="filter-operator-0"
                />

                {renderValueInput()}
            </div>

            <div className={styles.actions} data-test="filter-actions">
                <Button
                    type="button"
                    className={styles.resetBtn}
                    onClick={handleReset}
                    variant="stroke"
                    size="m"
                    data-test="filter-reset"
                >
                    {t("filter.reset")}
                </Button>
                <Button
                    type="button"
                    className={styles.applyBtn}
                    onClick={handleApply}
                    variant="fill"
                    size="m"
                    data-test="filter-apply"
                >
                    {t("filter.apply")}
                </Button>
            </div>
        </>
    );
}
