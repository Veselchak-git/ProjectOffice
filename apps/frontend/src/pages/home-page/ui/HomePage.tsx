/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { HOME } from "@helpdesk-portal/i18n";
import { useQuery } from "@tanstack/react-query";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { fetchDashboard } from "@/entities/dashboard";

import { useAuth } from "@/shared/lib/auth";
import { ErrorModal } from "@/shared/lib/error-boundary/ErrorModal";

import { ActivityFeed } from "./ActivityFeed";
import { DashboardCounters } from "./DashboardCounters";
import styles from "./HomePage.module.css";

export const HomePage: FC = () => {
    const { t } = useTranslation(HOME);
    const { user } = useAuth();
    const { data, isPending, isError, error } = useQuery({
        queryKey: ["dashboard"],
        queryFn: fetchDashboard
    });

    return (
        <div className={styles["home-page"]}>
            <DashboardCounters
                summary={data?.summary}
                isLoading={isPending}
                userRole={user?.role}
                login={user?.login}
            />
            <section className={styles["home-page__section"]}>
                <h2 className={styles["home-page__section-title"]}>{t("activity.title")}</h2>
                <ActivityFeed activity={data?.activity ?? []} isLoading={isPending} />
            </section>
            <ErrorModal
                isOpen={isError}
                message={error instanceof Error ? error.message : t("error.loading")}
                onClose={() => {}}
            />
        </div>
    );
};
