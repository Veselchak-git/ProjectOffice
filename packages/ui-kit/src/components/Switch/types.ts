export interface ISwitchProps {
    className?: string;
    inputSize?: "m" | "l";
    label?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}
