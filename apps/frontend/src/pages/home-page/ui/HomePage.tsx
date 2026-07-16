import { NS } from "@helpdesk-portal/i18n";
import { useQuery } from "@tanstack/react-query";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { fetchDashboard } from "@/entities/dashboard";

import { useAuth } from "@/shared/lib/auth";

import { ActivityFeed } from "./ActivityFeed";
import { DashboardCounters } from "./DashboardCounters";
import "./HomePage.css";

export const HomePage: FC = () => {
    const { t } = useTranslation(NS.home);
    const { user } = useAuth();
    const { data, isPending, isError, error } = useQuery({
        queryKey: ["dashboard"],
        queryFn: fetchDashboard
    });

    if (isError) {
        return (
            <div className="home-page">
                <p className="home-page__error">{error instanceof Error ? error.message : t("error.loading")}</p>
            </div>
        );
    }

    return (
        <div className="home-page">
            <DashboardCounters
                {...(data?.summary !== undefined ? { summary: data.summary } : {})}
                isLoading={isPending}
                {...(user?.role !== undefined ? { userRole: user.role } : {})}
            />
            <section className="home-page__section">
                <h2 className="home-page__section-title">{t("activity.title")}</h2>
                <ActivityFeed activity={data?.activity ?? []} isLoading={isPending} />
            </section>
        </div>
    );
};
