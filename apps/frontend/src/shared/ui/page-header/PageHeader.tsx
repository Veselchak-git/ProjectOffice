import clsx from "clsx";
import type { ReactNode } from "react";
import type { FC } from "react";

import styles from "./PageHeader.module.css";

export interface PageHeaderProps {
    title: string;
    subtitle?: string | number;
    actions?: ReactNode;
    className?: string;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, subtitle, actions, className }) => (
    <div className={clsx(styles["page-header"], className)}>
        <div className={styles["page-header__text"]}>
            <h1 className={styles["page-header__title"]}>{title}</h1>
            {subtitle != null && <p className={styles["page-header__subtitle"]}>{subtitle}</p>}
        </div>
        {actions && <div className={styles["page-header__actions"]}>{actions}</div>}
    </div>
);
