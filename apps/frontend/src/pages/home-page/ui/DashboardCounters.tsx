/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { HOME } from "@helpdesk-portal/i18n";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import type { DashboardSummary } from "@/entities/dashboard";

import type { UserRole } from "@/shared/lib/auth";

import styles from "./DashboardCounters.module.css";

interface Props {
    summary?: DashboardSummary | undefined;
    isLoading?: boolean;
    userRole?: UserRole | undefined;
    login?: string | undefined;
}

export const DashboardCounters: FC<Props> = ({ summary, isLoading, userRole, login }) => {
    const { t } = useTranslation(HOME);

    if (isLoading) {
        return (
            <div className={styles["dashboard-counters"]}>
                <div className={`${styles["dashboard-counters__card"]} ${styles["dashboard-counters__card--loading"]}`}>
                    <span className={styles["dashboard-counters__label"]}>&nbsp;</span>
                    <span className={styles["dashboard-counters__value"]}>&mdash;</span>
                </div>
                <div className={`${styles["dashboard-counters__card"]} ${styles["dashboard-counters__card--loading"]}`}>
                    <span className={styles["dashboard-counters__label"]}>&nbsp;</span>
                    <span className={styles["dashboard-counters__value"]}>&mdash;</span>
                </div>
                <div className={`${styles["dashboard-counters__card"]} ${styles["dashboard-counters__card--loading"]}`}>
                    <span className={styles["dashboard-counters__label"]}>&nbsp;</span>
                    <span className={styles["dashboard-counters__value"]}>&mdash;</span>
                </div>
            </div>
        );
    }

    const buildFilterQuery = (filter: unknown): string => `?filter=${encodeURIComponent(JSON.stringify(filter))}`;

    const counters = [
        { label: t("dashboard.projects"), value: summary?.totalProjects ?? 0, to: "/projects" },
        {
            label: t("dashboard.assigned"),
            value: summary?.totalAssigned ?? 0,
            to: login
                ? `/tasks${buildFilterQuery({
                      logic: "AND",
                      conditions: [{ field: "assigneeLogin", operator: "eq", value: login }]
                  })}`
                : "/tasks"
        },
        {
            label: t("dashboard.closed"),
            value: summary?.totalClosed ?? 0,
            to: `/tasks${buildFilterQuery({
                logic: "AND",
                conditions: [{ field: "status", operator: "eq", value: "CLOSED" }]
            })}`
        }
    ];

    if (userRole === "ADMIN") {
        counters.push({
            label: t("dashboard.users"),
            value: summary?.totalUsers ?? 0,
            to: "/users"
        });
    }

    return (
        <div className={styles["dashboard-counters"]}>
            {counters.map(counter => (
                <Link key={counter.to + counter.label} to={counter.to} className={styles["dashboard-counters__card"]}>
                    <span className={styles["dashboard-counters__label"]}>{counter.label}</span>
                    <span className={styles["dashboard-counters__value"]}>{counter.value}</span>
                </Link>
            ))}
        </div>
    );
};
