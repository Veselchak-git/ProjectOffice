import type { FieldOption, FilterCondition, FilterOperator } from "./types";

export function getOperatorsForFieldType(
    type: "enum" | "text" | "date" | "id"
): { value: FilterOperator; label: string }[] {
    switch (type) {
        case "enum":
            return [
                { value: "in", label: "В списке" },
                { value: "not_in", label: "Не в списке" }
            ];
        case "text":
            return [
                { value: "contains", label: "Содержит" },
                { value: "not_contains", label: "Не содержит" },
                { value: "starts_with", label: "Начинается с" },
                { value: "eq", label: "Точное совпадение" }
            ];
        case "date":
            return [
                { value: "after", label: "После" },
                { value: "before", label: "До" },
                { value: "eq", label: "Точное совпадение" }
            ];
        case "id":
            return [
                { value: "eq", label: "Равно" },
                { value: "neq", label: "Не равно" }
            ];
        default:
            return [];
    }
}

export function getValueInputType(operator: FilterOperator, fieldType?: string): "text" | "date" | "multiselect" {
    switch (operator) {
        case "in":
        case "not_in":
            return "multiselect";
        case "after":
        case "before":
            return "date";
        case "eq":
            if (fieldType === "date") return "date";
            return "text";
        default:
            return "text";
    }
}

export function formatFilterChipLabel(condition: FilterCondition, fieldConfig: FieldOption): string {
    const label = fieldConfig.label;

    if (fieldConfig.type === "enum" && Array.isArray(condition.value)) {
        const values = condition.value
            .map(v => fieldConfig.enumValues?.find(e => e.value === v)?.label ?? v)
            .join(", ");
        return `${label}: ${values}`;
    }

    if (fieldConfig.type === "enum" && typeof condition.value === "string") {
        const enumLabel = fieldConfig.enumValues?.find(e => e.value === condition.value)?.label ?? condition.value;
        return `${label}: ${enumLabel}`;
    }

    return `${label}: ${condition.value}`;
}
