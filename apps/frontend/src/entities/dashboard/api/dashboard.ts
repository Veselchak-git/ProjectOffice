/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { COMMON } from "@helpdesk-portal/i18n";

import { handleApiResponse } from "@/shared/lib/api";
import { apiClient } from "@/shared/lib/auth";
import { i18n } from "@/shared/lib/i18n";

import type { DashboardData } from "../model/dashboard";

export async function fetchDashboard(): Promise<DashboardData> {
    const res = await apiClient("/api/dashboard");
    return handleApiResponse<DashboardData>(res, i18n.t(`${COMMON}:error.loading`));
}
