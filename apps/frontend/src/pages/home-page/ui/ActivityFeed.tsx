/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { HOME } from "@helpdesk-portal/i18n";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { ru } from "date-fns/locale/ru";
import type { TFunction } from "i18next";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import type { ActivityItem as ActivityItemType } from "@/entities/dashboard/model/dashboard";

import { i18n } from "@/shared/lib/i18n";

import styles from "./ActivityFeed.module.css";

interface Props {
    activity: ActivityItemType[];
    isLoading?: boolean;
}

function timeAgo(dateStr: string): string {
    const locale = i18n.language === "ru" ? ru : enUS;
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale });
}

function getActivityMessage(t: TFunction<"home", undefined>, item: ActivityItemType): string {
    switch (item.type) {
        case "issue_created":
            return t("activity.issue_created", { issueTitle: item.issueTitle });
        case "issue_updated":
            return t("activity.issue_updated", { issueTitle: item.issueTitle });
        case "issue_deleted":
            return t("activity.issue_deleted", { issueTitle: item.issueTitle });
        case "project_created":
            return t("activity.project_created", { projectName: item.projectName });
        case "project_updated":
            return t("activity.project_updated", { projectName: item.projectName });
        case "project_deleted":
            return t("activity.project_deleted", { projectName: item.projectName });
    }
}

export const ActivityFeed: FC<Props> = ({ activity, isLoading }) => {
    const { t } = useTranslation(HOME);

    if (isLoading) {
        return (
            <div className={styles["activity-feed"]}>
                <p className={styles["activity-feed__empty"]}>{t("activity.loading")}</p>
            </div>
        );
    }

    if (!activity.length) {
        return (
            <div className={styles["activity-feed"]}>
                <p className={styles["activity-feed__empty"]}>{t("activity.empty")}</p>
            </div>
        );
    }

    return (
        <div className={styles["activity-feed"]}>
            <ul className={styles["activity-feed__list"]}>
                {activity.map(item => (
                    <li key={item.id} className={styles["activity-feed__item"]}>
                        <div className={styles["activity-feed__line"]}>
                            <span className={styles["activity-feed__message"]}>
                                {item.issueId ? (
                                    <Link to={`/tasks/${item.issueId}`} className={styles["activity-feed__link"]}>
                                        {getActivityMessage(t, item)}
                                    </Link>
                                ) : item.projectId ? (
                                    <Link to={`/projects/${item.projectId}`} className={styles["activity-feed__link"]}>
                                        {getActivityMessage(t, item)}
                                    </Link>
                                ) : (
                                    getActivityMessage(t, item)
                                )}
                            </span>
                        </div>
                        <span className={styles["activity-feed__time"]}>{timeAgo(item.timestamp)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
