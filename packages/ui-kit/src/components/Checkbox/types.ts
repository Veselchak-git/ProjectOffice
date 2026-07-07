export interface ICheckboxProps {
    className?: string;
    inputSize?: "m" | "l";
    label?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}
