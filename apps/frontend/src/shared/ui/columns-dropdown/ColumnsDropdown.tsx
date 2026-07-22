/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { COMMON } from "@helpdesk-portal/i18n";
import GearIcon from "@helpdesk-portal/icons/GearIcon.svg?react";
import { Button } from "@helpdesk-portal/ui-kit";
import type { Table } from "@tanstack/react-table";
import clsx from "clsx";
import { type RefObject } from "react";
import { useTranslation } from "react-i18next";

import { i18n } from "@/shared/lib/i18n";

import { SortableColumnItem } from "@/shared/ui/data-table";
import type { ColumnDefMeta } from "@/shared/ui/data-table";

import styles from "./ColumnsDropdown.module.css";

interface ColumnsDropdownProps<TData> {
    columnsRef: RefObject<HTMLDivElement | null>;
    columnsOpen: boolean;
    setColumnsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    columnOrder: string[];
    allColumns: ColumnDefMeta[];
    table: Table<TData>;
    handleDragEnd: (event: DragEndEvent) => void;
    exclude?: string[];
    className?: string;
}

export const ColumnsDropdown = <TData,>({
    columnsRef,
    columnsOpen,
    setColumnsOpen,
    columnOrder,
    allColumns,
    table,
    handleDragEnd,
    exclude = ["select"],
    className
}: ColumnsDropdownProps<TData>) => {
    const { t } = useTranslation(COMMON);
    const filteredOrder = columnOrder.filter(id => !exclude.includes(id));

    return (
        <div ref={columnsRef} className={clsx(styles["columns-dropdown-wrapper"], className)}>
            <Button
                className={styles["columns-dropdown__btn"]}
                type="button"
                onClick={() => setColumnsOpen(v => !v)}
                startIcon={<GearIcon />}
            >
                {t("columns")}
            </Button>
            {columnsOpen && (
                <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                    <SortableContext items={filteredOrder} strategy={verticalListSortingStrategy}>
                        <div className={styles["columns-dropdown__menu"]}>
                            {filteredOrder.map(id => {
                                const col = allColumns.find(c => c.id === id);
                                if (!col) return null;
                                return (
                                    <SortableColumnItem
                                        key={col.id}
                                        id={col.id}
                                        label={i18n.t(col.label)}
                                        isVisible={table.getColumn(col.id)?.getIsVisible() ?? true}
                                        onToggle={() => table.getColumn(col.id)?.toggleVisibility()}
                                    />
                                );
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
};
