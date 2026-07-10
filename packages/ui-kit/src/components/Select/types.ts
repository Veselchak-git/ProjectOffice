export interface ISelectOption {
    value: string;
    label: string;
}

export interface ISelectProps {
    className?: string;
    color?: "default" | "error";
    inputSize?: "m" | "l";
    label?: string;
    errorMessage?: string;
    placeholder?: string;
    value?: string;
    defaultValue?: string;
    options: ISelectOption[];
    disabled?: boolean;
    startIcon?: React.ReactNode;
    usePortal?: boolean;
    onValueChange?: (value: string) => void;
}
