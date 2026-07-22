import clsx from "clsx";
import type { ReactNode } from "react";
import type { FC } from "react";

import styles from "./DetailField.module.css";

export interface DetailFieldProps {
    label: string;
    children: ReactNode;
    multiline?: boolean;
    className?: string;
}

export const DetailField: FC<DetailFieldProps> = ({ label, children, multiline, className }) => (
    <div className={clsx(styles["detail-field"], multiline && styles["detail-field--multiline"], className)}>
        <span className={styles["detail-field__label"]}>{label}</span>
        <span className={styles["detail-field__value"]}>{children}</span>
    </div>
);
