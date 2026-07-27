/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import AscSortIcon from "@helpdesk-portal/icons/AscSort.svg?react";
import DescSortIcon from "@helpdesk-portal/icons/DescSort.svg?react";
import FilterIcon from "@helpdesk-portal/icons/Filter.svg?react";
import NoneSortIcon from "@helpdesk-portal/icons/NoneSort.svg?react";
import ResetFilterIcon from "@helpdesk-portal/icons/ResetFilter.svg?react";
import { Button } from "@helpdesk-portal/ui-kit";
import type { FC, ReactNode } from "react";
import { useCallback } from "react";

import styles from "./ColumnHeader.module.css";

export interface ColumnHeaderProps {
    title: string;
    field: string;
    sortState: "none" | "asc" | "desc";
    isActiveFilter: boolean;
    onFilterClick?: (field: string) => void;
    onFilterReset?: (field: string) => void;
    children?: ReactNode;
}

export const ColumnHeader: FC<ColumnHeaderProps> = ({
    title,
    field,
    sortState,
    isActiveFilter,
    onFilterClick,
    children
}) => {
    const handleFilterClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onFilterClick?.(field);
        },
        [field, onFilterClick]
    );

    const headerClassName = `${styles["column-header"]}${isActiveFilter ? ` ${styles["column-header--active"]}` : ""}`;

    return (
        <div className={headerClassName} data-test={`column-header-${field}`}>
            <Button
                variant="link"
                size="m"
                iconOnly
                className={styles["column-header__filter-icon"]}
                onClick={handleFilterClick}
                data-test={`column-header-filter-icon-${field}`}
                aria-label={`Фильтр по ${title}`}
            >
                {isActiveFilter ? <ResetFilterIcon /> : <FilterIcon />}
            </Button>
            <span className={styles["column-header__title"]} data-test={`column-header-title-${field}`}>
                {title}
            </span>
            <Button
                variant="link"
                size="m"
                iconOnly
                className={styles["column-header__sort-btn"]}
                data-test={`column-header-sort-btn-${field}`}
                aria-label={`Сортировка по ${title}`}
            >
                {sortState === "asc" && <AscSortIcon />}
                {sortState === "desc" && <DescSortIcon />}
                {sortState === "none" && <NoneSortIcon />}
            </Button>
            {children}
        </div>
    );
};
