import type { InputHTMLAttributes, ReactNode } from "react";

export type InputColor = "default" | "error";
export type InputSize = "m" | "l";

export interface IInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
    color?: InputColor;
    inputSize?: InputSize;
    label?: string;
    errorMessage?: string | undefined;
    startIcon?: ReactNode;
    endIcon?: ReactNode;
    filled?: boolean;
}
