export type FilterOperator =
    | "eq"
    | "neq"
    | "contains"
    | "not_contains"
    | "starts_with"
    | "in"
    | "not_in"
    | "after"
    | "before";

export type FilterCondition = {
    id: string;
    field: string;
    operator: FilterOperator;
    value: string | string[];
};

export type FilterGroup = {
    logic: "AND" | "OR";
    conditions: FilterCondition[];
};

export type FieldOption = {
    field: string;
    label: string;
    type: "enum" | "text" | "date";
    enumValues?: { value: string; label: string }[];
};

export type TableFilterConfig = {
    fields: FieldOption[];
    maxConditions?: number;
};

export type FilterState = {
    groups: FilterGroup[];
    fieldConfigs: FieldOption[];
};
