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

import "./DashboardCounters.css";

interface Props {
    summary?: DashboardSummary;
    isLoading?: boolean;
    userRole?: UserRole;
}

export const DashboardCounters: FC<Props> = ({ summary, isLoading, userRole }) => {
    const { t } = useTranslation(HOME);

    if (isLoading) {
        return (
            <div className="dashboard-counters">
                <div className="dashboard-counters__card dashboard-counters__card--loading">
                    <span className="dashboard-counters__label">&nbsp;</span>
                    <span className="dashboard-counters__value">&mdash;</span>
                </div>
                <div className="dashboard-counters__card dashboard-counters__card--loading">
                    <span className="dashboard-counters__label">&nbsp;</span>
                    <span className="dashboard-counters__value">&mdash;</span>
                </div>
                <div className="dashboard-counters__card dashboard-counters__card--loading">
                    <span className="dashboard-counters__label">&nbsp;</span>
                    <span className="dashboard-counters__value">&mdash;</span>
                </div>
            </div>
        );
    }

    const counters = [
        { label: t("dashboard.projects"), value: summary?.totalProjects ?? 0, to: "/projects" },
        { label: t("dashboard.assigned"), value: summary?.totalAssigned ?? 0, to: "/tasks" },
        { label: t("dashboard.closed"), value: summary?.totalClosed ?? 0, to: "/tasks" }
    ];

    if (userRole === "ADMIN") {
        counters.push({
            label: t("dashboard.users"),
            value: summary?.totalUsers ?? 0,
            to: "/users"
        });
    }

    return (
        <div className="dashboard-counters">
            {counters.map(counter => (
                <Link key={counter.to + counter.label} to={counter.to} className="dashboard-counters__card">
                    <span className="dashboard-counters__label">{counter.label}</span>
                    <span className="dashboard-counters__value">{counter.value}</span>
                </Link>
            ))}
        </div>
    );
};
