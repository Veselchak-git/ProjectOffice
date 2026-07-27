export interface IMultiSelectOption {
    value: string;
    label: string;
}

export interface IMultiSelectProps {
    className?: string;
    options: IMultiSelectOption[];
    selected: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    usePortal?: boolean;
}
