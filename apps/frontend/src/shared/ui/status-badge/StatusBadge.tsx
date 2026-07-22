import clsx from "clsx";
import type { FC } from "react";

import styles from "./StatusBadge.module.css";

export interface StatusBadgeProps {
    status: string;
    labels?: Record<string, string>;
    variant?: "status" | "priority";
    className?: string;
}

export const StatusBadge: FC<StatusBadgeProps> = ({ status, labels, variant = "status", className }) => {
    const baseClassName = variant === "priority" ? styles["priority-badge"] : styles["status-badge"];
    const statusClassName =
        variant === "priority"
            ? styles[`priority-badge--${status.toLowerCase()}`]
            : styles[`status-badge--${status.toLowerCase()}`];
    const label = labels?.[status] ?? status;
    return <span className={clsx(baseClassName, statusClassName, className)}>{label}</span>;
};
