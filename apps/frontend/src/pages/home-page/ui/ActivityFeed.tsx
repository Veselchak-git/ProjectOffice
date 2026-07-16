/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { NS } from "@helpdesk-portal/i18n";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import type { ActivityItem as ActivityItemType } from "@/entities/dashboard/model/dashboard";

import "./ActivityFeed.css";

interface Props {
    activity: ActivityItemType[];
    isLoading?: boolean;
}

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const seconds = Math.floor((now - then) / 1000);
    if (seconds < 60) return `${seconds}с`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}м`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}ч`;
    const days = Math.floor(hours / 24);
    return `${days}д`;
}

function getTypeIcon(type: ActivityItemType["type"]): string {
    switch (type) {
        case "issue_created":
            return "🆕";
        case "status_changed":
            return "🔄";
        case "assigned":
            return "👤";
    }
}

export const ActivityFeed: FC<Props> = ({ activity, isLoading }) => {
    const { t } = useTranslation(NS.home);

    if (isLoading) {
        return (
            <div className="activity-feed">
                <p className="activity-feed__empty">{t("activity.loading")}</p>
            </div>
        );
    }

    if (!activity.length) {
        return (
            <div className="activity-feed">
                <p className="activity-feed__empty">{t("activity.empty")}</p>
            </div>
        );
    }

    return (
        <div className="activity-feed">
            <ul className="activity-feed__list">
                {activity.map(item => (
                    <li key={item.id} className="activity-feed__item">
                        <div className="activity-feed__line">
                            <span className="activity-feed__icon">{getTypeIcon(item.type)}</span>
                            <span className="activity-feed__message">
                                {item.issueId ? (
                                    <Link to={`/tasks/${item.issueId}`} className="activity-feed__link">
                                        {item.message}
                                    </Link>
                                ) : (
                                    item.message
                                )}
                            </span>
                        </div>
                        <span className="activity-feed__time">{timeAgo(item.timestamp)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
