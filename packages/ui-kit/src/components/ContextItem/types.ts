import type { ReactNode } from "react";

export interface IContextItemProps {
    className?: string;
    label: string;
    icon?: ReactNode;
    endIcon?: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
}
