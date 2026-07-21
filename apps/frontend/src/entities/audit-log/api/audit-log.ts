/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { AUDIT } from "@helpdesk-portal/i18n";

import { buildQueryString, handleApiResponse } from "@/shared/lib/api";
import { apiClient } from "@/shared/lib/auth";

import type { AuditLog, FetchAuditLogsParams } from "../model/audit-log";

export interface FetchAuditLogsResponse {
    logs: AuditLog[];
    total: number;
    page: number;
    perPage: number;
}

export async function fetchAuditLogs(params?: FetchAuditLogsParams): Promise<FetchAuditLogsResponse> {
    const query = buildQueryString(params);
    const res = await apiClient(`/api/audit-log${query}`);
    return handleApiResponse<FetchAuditLogsResponse>(res, AUDIT, "error.loading");
}
