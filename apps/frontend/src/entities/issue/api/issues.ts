import { NS } from "@helpdesk-portal/i18n";

import { handleApiResponse } from "@/shared/lib/api";
import { apiClient } from "@/shared/lib/auth";
import { i18n } from "@/shared/lib/i18n";

import type { CreateIssueData, FetchIssuesParams, Issue, UpdateIssueData } from "../model/issue";

export interface FetchIssuesResponse {
    issues: Issue[];
    total: number;
    page: number;
    perPage: number;
}

export async function fetchIssues(params?: FetchIssuesParams): Promise<FetchIssuesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set("q", params.q);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.perPage) searchParams.set("perPage", String(params.perPage));
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.priority) searchParams.set("priority", params.priority);
    if (params?.category) searchParams.set("category", params.category);

    const query = searchParams.toString();
    const res = await apiClient(`/api/issues${query ? `?${query}` : ""}`);
    return handleApiResponse<FetchIssuesResponse>(res, i18n.t(`${NS.issues}:error.loading`));
}

export async function fetchIssue(id: number): Promise<Issue> {
    const res = await apiClient(`/api/issues/${id}`);
    return handleApiResponse<Issue>(res, i18n.t(`${NS.issues}:error.loadOne`));
}

export async function fetchProjectIssues(projectId: number, params?: FetchIssuesParams): Promise<FetchIssuesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set("q", params.q);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.perPage) searchParams.set("perPage", String(params.perPage));
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.priority) searchParams.set("priority", params.priority);
    if (params?.category) searchParams.set("category", params.category);

    const query = searchParams.toString();
    const res = await apiClient(`/api/projects/${projectId}/issues${query ? `?${query}` : ""}`);
    return handleApiResponse<FetchIssuesResponse>(res, i18n.t(`${NS.issues}:error.loading`));
}

export async function createIssue(projectId: number, data: CreateIssueData): Promise<Issue> {
    const res = await apiClient(`/api/projects/${projectId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return handleApiResponse<Issue>(res, i18n.t(`${NS.issues}:error.create`));
}

export async function updateIssue(id: number, data: UpdateIssueData): Promise<Issue> {
    const res = await apiClient(`/api/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return handleApiResponse<Issue>(res, i18n.t(`${NS.issues}:error.update`));
}

export async function deleteIssue(id: number): Promise<void> {
    const res = await apiClient(`/api/issues/${id}`, {
        method: "DELETE"
    });
    await handleApiResponse<void>(res, i18n.t(`${NS.issues}:error.delete`));
}
