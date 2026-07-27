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

import { getOperatorsForFieldType, getValueInputType } from "../../lib/use-table-filter/operator-helpers";
import type { FieldOption, FilterCondition, FilterOperator } from "../../lib/use-table-filter/types";
import styles from "./FilterPopover.module.css";

const POPOVER_WIDTH = 550;

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

function FilterPopoverContent({ fields, conditions, logic: logicProp, initialField, onApply, onReset }: ContentProps) {
    const { t } = useTranslation("common");

    // ── Initial values (recomputed via useMemo when props change) ──────
    const initialFieldValues = useMemo(() => {
        const arr: string[] = ["", ""];
        conditions.forEach((c, i) => {
            if (i < 2) arr[i] = c.field;
        });
        if (initialField && !arr[0]) arr[0] = initialField;
        return arr;
    }, [conditions, initialField]);

    const initialOperatorValues = useMemo(() => {
        const defaultOp = (index: number): FilterOperator => {
            const f = index === 0 && initialField ? initialField : initialFieldValues[index];
            const fieldOpt = fields.find(fo => fo.field === (f ?? ""));
            const ops = fieldOpt ? getOperatorsForFieldType(fieldOpt.type) : [];
            return (ops[0]?.value as FilterOperator) ?? "contains";
        };
        const arr: FilterOperator[] = [defaultOp(0), defaultOp(1)];
        conditions.forEach((c, i) => {
            if (i < 2) arr[i] = c.operator;
        });
        return arr;
    }, [conditions, initialField, fields, initialFieldValues]);

    const initialValueValues = useMemo(() => {
        const arr: (string | string[])[] = ["", ""];
        conditions.forEach((c, i) => {
            if (i < 2) arr[i] = c.value;
        });
        return arr;
    }, [conditions]);

    // ── Local editing state ────────────────────────────────────────────
    const [fieldValues, setFieldValues] = useState<string[]>(initialFieldValues);
    const [operatorValues, setOperatorValues] = useState<FilterOperator[]>(initialOperatorValues);
    const [valueValues, setValueValues] = useState<(string | string[])[]>(initialValueValues);
    const [logicValue, setLogicValue] = useState<"AND" | "OR">(logicProp);

    // ── Handlers (no useCallback — React Compiler manages memoisation) ─

    const handleFieldChange = (rowIndex: number, newField: string) => {
        setFieldValues(prev => {
            const next = [...prev];
            next[rowIndex] = newField;
            return next;
        });

        const fieldOption = fields.find(f => f.field === newField);
        if (fieldOption) {
            const operators = getOperatorsForFieldType(fieldOption.type);
            const firstOperator = operators[0]?.value ?? "contains";
            setOperatorValues(prev => {
                const next = [...prev];
                next[rowIndex] = firstOperator;
                return next;
            });
        }

        setValueValues(prev => {
            const next = [...prev];
            next[rowIndex] = "";
            return next;
        });
    };

    const handleOperatorChange = (rowIndex: number, newOperator: FilterOperator) => {
        const prevOperator = operatorValues[rowIndex]!;
        const prevType = getValueInputType(prevOperator);
        const newType = getValueInputType(newOperator);

        setOperatorValues(prev => {
            const next = [...prev];
            next[rowIndex] = newOperator;
            return next;
        });

        if (prevType !== newType) {
            setValueValues(prev => {
                const next = [...prev];
                next[rowIndex] = newType === "multiselect" ? [] : "";
                return next;
            });
        }
    };

    const handleValueChange = (rowIndex: number, newValue: string | string[]) => {
        setValueValues(prev => {
            const next = [...prev];
            next[rowIndex] = newValue;
            return next;
        });
    };

    const handleToggleLogic = () => {
        setLogicValue(prev => (prev === "AND" ? "OR" : "AND"));
    };

    const handleApply = useCallback(() => {
        const appliedConditions: FilterCondition[] = [];

        for (let i = 0; i < 2; i++) {
            if (fieldValues[i]) {
                appliedConditions.push({
                    id: generateId(),
                    field: fieldValues[i]!,
                    operator: operatorValues[i]!,
                    value: valueValues[i]!
                });
            }
        }

        onApply(appliedConditions, logicValue);
    }, [fieldValues, operatorValues, valueValues, logicValue, onApply]);

    const handleReset = () => {
        const defaultOp = (index: number): FilterOperator => {
            const f = index === 0 && initialField ? initialField : "";
            const fieldOpt = fields.find(fo => fo.field === f);
            const ops = fieldOpt ? getOperatorsForFieldType(fieldOpt.type) : [];
            return (ops[0]?.value as FilterOperator) ?? "contains";
        };
        setFieldValues([initialField ?? "", ""]);
        setOperatorValues([defaultOp(0), defaultOp(1)]);
        setValueValues(["", ""]);
        setLogicValue(logicProp);
        onReset();
    };

    // ── Derived display logic ──────────────────────────────────────────
    const hasSecondRow = initialField ? true : Boolean(fieldValues[1]);
    const showConnector = Boolean(fieldValues[0] && fieldValues[1]);

    // ── Render helpers ─────────────────────────────────────────────────
    const renderValueInput = (rowIndex: number) => {
        const fieldOption = fields.find(f => f.field === fieldValues[rowIndex]);
        const inputType = getValueInputType(operatorValues[rowIndex]!);

        if (inputType === "multiselect" && fieldOption?.enumValues) {
            const selected = Array.isArray(valueValues[rowIndex]) ? (valueValues[rowIndex] as string[]) : [];
            return (
                <MultiSelect
                    options={fieldOption.enumValues}
                    selected={selected}
                    onChange={values => handleValueChange(rowIndex, values)}
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
                <Input
                    type="date"
                    className={styles.valueInput}
                    value={typeof valueValues[rowIndex] === "string" ? (valueValues[rowIndex] as string) : ""}
                    onChange={e => handleValueChange(rowIndex, e.target.value)}
                    data-test={`filter-value-${rowIndex}`}
                />
            );
        }

        return (
            <Input
                type="text"
                className={styles.valueInput}
                placeholder={t("filter.placeholder.value")}
                value={typeof valueValues[rowIndex] === "string" ? (valueValues[rowIndex] as string) : ""}
                onChange={e => handleValueChange(rowIndex, e.target.value)}
                data-test={`filter-value-${rowIndex}`}
            />
        );
    };

    const renderRow = (rowIndex: number) => {
        const isFixedField = rowIndex === 0 && initialField != null;
        const fieldOption = fields.find(f => f.field === fieldValues[rowIndex]);
        const operators = fieldOption ? getOperatorsForFieldType(fieldOption.type) : getOperatorsForFieldType("text");

        return (
            <div className={styles.row} data-test={`filter-row-${rowIndex}`}>
                {isFixedField ? (
                    <span className={styles.fieldLabel} data-test="filter-field-label-0">
                        {fieldOption?.label ?? initialField}
                    </span>
                ) : (
                    <Select
                        className={styles.fieldSelect ?? ""}
                        placeholder={t("filter.placeholder.select")}
                        options={fields.map(field => ({ value: field.field, label: field.label }))}
                        value={fieldValues[rowIndex] ?? ""}
                        onValueChange={value => handleFieldChange(rowIndex, value)}
                        usePortal={false}
                        data-test={`filter-field-${rowIndex}`}
                    />
                )}

                <Select
                    className={styles.fieldSelect ?? ""}
                    placeholder={t("filter.placeholder.select")}
                    options={operators.map(op => ({ value: op.value, label: t(`filter.operator.${op.value}`) }))}
                    value={operatorValues[rowIndex] ?? ""}
                    onValueChange={value => handleOperatorChange(rowIndex, value as FilterOperator)}
                    usePortal={false}
                    data-test={`filter-operator-${rowIndex}`}
                />

                {renderValueInput(rowIndex)}
            </div>
        );
    };

    // ── Render ─────────────────────────────────────────────────────────
    return (
        <>
            <div className={styles.title} data-test="filter-popover-title">
                <FilterIcon />
                {t("filter.title")}
            </div>

            {renderRow(0)}

            {showConnector && (
                <Button
                    type="button"
                    onClick={handleToggleLogic}
                    variant="stroke"
                    size="s"
                    className={styles.connectorBtn}
                    data-test="filter-logic-toggle"
                >
                    {t(`filter.logic.${logicValue}`)}
                </Button>
            )}

            {hasSecondRow && renderRow(1)}

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
