import type { ReactNode } from "react";

export type ModalSize = "s" | "m" | "l";

export interface IModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: ModalSize;
    className?: string;
}
