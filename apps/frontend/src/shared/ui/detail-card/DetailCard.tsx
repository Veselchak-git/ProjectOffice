import clsx from "clsx";
import type { ReactNode } from "react";
import type { FC } from "react";

import styles from "./DetailCard.module.css";

export interface DetailCardProps {
    header: ReactNode;
    children: ReactNode;
    className?: string;
}

export const DetailCard: FC<DetailCardProps> = ({ header, children, className }) => (
    <div className={clsx(styles["detail-card"], className)}>
        <div className={styles["detail-card__header"]}>{header}</div>
        <div className={styles["detail-card__fields"]}>{children}</div>
    </div>
);
