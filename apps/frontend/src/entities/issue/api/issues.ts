/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { ISSUES } from "@helpdesk-portal/i18n";

import { buildQueryString, handleApiResponse } from "@/shared/lib/api";
import { apiClient } from "@/shared/lib/auth";

import type { CreateIssueData, FetchIssuesParams, Issue, UpdateIssueData } from "../model/issue";

export interface FetchIssuesResponse {
    issues: Issue[];
    total: number;
    page: number;
    perPage: number;
}

async function fetchIssuesByUrl(url: string, params?: FetchIssuesParams): Promise<FetchIssuesResponse> {
    const query = buildQueryString(params);
    const res = await apiClient(`${url}${query}`);
    return handleApiResponse<FetchIssuesResponse>(res, ISSUES, "error.loading");
}

export async function fetchIssues(params?: FetchIssuesParams): Promise<FetchIssuesResponse> {
    return fetchIssuesByUrl("/api/issues", params);
}

export async function fetchIssue(id: number): Promise<Issue> {
    const res = await apiClient(`/api/issues/${id}`);
    return handleApiResponse<Issue>(res, ISSUES, "error.loadOne");
}

export async function fetchProjectIssues(projectId: number, params?: FetchIssuesParams): Promise<FetchIssuesResponse> {
    return fetchIssuesByUrl(`/api/projects/${projectId}/issues`, params);
}

export async function createIssue(projectId: number, data: CreateIssueData): Promise<Issue> {
    const res = await apiClient(`/api/projects/${projectId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return handleApiResponse<Issue>(res, ISSUES, "error.create");
}

export async function updateIssue(id: number, data: UpdateIssueData): Promise<Issue> {
    const res = await apiClient(`/api/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return handleApiResponse<Issue>(res, ISSUES, "error.update");
}

export async function deleteIssue(id: number): Promise<void> {
    const res = await apiClient(`/api/issues/${id}`, {
        method: "DELETE"
    });
    await handleApiResponse<void>(res, ISSUES, "error.delete");
}
