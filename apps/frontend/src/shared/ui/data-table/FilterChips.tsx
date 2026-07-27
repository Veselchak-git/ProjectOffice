import ResetFilterIcon from "@helpdesk-portal/icons/ResetFilter.svg?react";
import { Button } from "@helpdesk-portal/ui-kit";
import { useTranslation } from "react-i18next";

import { formatFilterChipLabel } from "../../lib/use-table-filter/operator-helpers";
import type { FieldOption, FilterCondition } from "../../lib/use-table-filter/types";
import styles from "./FilterChips.module.css";

type FilterChipsProps = {
    conditions: FilterCondition[];
    fieldConfigs: FieldOption[];
    onRemove: (conditionId: string) => void;
    onClearAll: () => void;
};

export function FilterChips({ conditions, fieldConfigs, onRemove, onClearAll }: FilterChipsProps) {
    const { t } = useTranslation("common");
    if (conditions.length === 0) {
        return null;
    }

    return (
        <div className={styles["filter-chips"]} data-test="filter-chips">
            {conditions.map(condition => {
                const fieldConfig = fieldConfigs.find(f => f.field === condition.field);
                if (!fieldConfig) {
                    return null;
                }

                const label = formatFilterChipLabel(condition, fieldConfig);

                return (
                    <span key={condition.id} className={styles["filter-chips__chip"]} data-test="filter-chip">
                        {label}
                        <Button
                            variant="link"
                            size="m"
                            className={styles["filter-chips__remove"]}
                            onClick={() => onRemove(condition.id)}
                            data-test="filter-chip-remove"
                            aria-label={t("filter.removeAria", { label })}
                        >
                            &times;
                        </Button>
                    </span>
                );
            })}
            <Button
                variant="fill"
                color="accent"
                size="s"
                className={styles["filter-chips__clear"]}
                onClick={onClearAll}
                data-test="filter-chips-clear"
                startIcon={<ResetFilterIcon />}
            >
                {t("filter.clearAll")}
            </Button>
        </div>
    );
}
