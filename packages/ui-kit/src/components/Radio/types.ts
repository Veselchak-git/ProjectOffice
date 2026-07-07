export interface IRadioOption {
    value: string;
    label: string;
}

export interface IRadioProps {
    className?: string;
    inputSize?: "m" | "l";
    name: string;
    value?: string;
    defaultValue?: string;
    options: IRadioOption[];
    disabled?: boolean;
    onValueChange?: (value: string) => void;
}
