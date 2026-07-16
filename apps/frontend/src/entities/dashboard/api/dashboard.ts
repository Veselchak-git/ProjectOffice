import { NS } from "@helpdesk-portal/i18n";

import { handleApiResponse } from "@/shared/lib/api";
import { apiClient } from "@/shared/lib/auth";
import { i18n } from "@/shared/lib/i18n";

import type { DashboardData } from "../model/dashboard";

export async function fetchDashboard(): Promise<DashboardData> {
    const res = await apiClient("/api/dashboard");
    return handleApiResponse<DashboardData>(res, i18n.t(`${NS.common}:error.loading`));
}
