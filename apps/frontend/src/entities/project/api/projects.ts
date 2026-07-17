/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { PROJECTS } from "@helpdesk-portal/i18n";

import { buildQueryString, handleApiResponse } from "@/shared/lib/api";
import { apiClient } from "@/shared/lib/auth";
import { i18n } from "@/shared/lib/i18n";

import type {
    CreateProjectData,
    FetchProjectsParams,
    Member,
    Project,
    ProjectMemberRole,
    UpdateProjectData
} from "../model/project";

export interface FetchProjectsResponse {
    projects: Project[];
    total: number;
    active: number;
    page: number;
    perPage: number;
}

export async function fetchProjects(params?: FetchProjectsParams): Promise<FetchProjectsResponse> {
    const query = buildQueryString(params);
    const res = await apiClient(`/api/projects${query}`);
    return handleApiResponse<FetchProjectsResponse>(res, i18n.t(`${PROJECTS}:error.loading`));
}

export async function fetchProject(id: number): Promise<Project> {
    const res = await apiClient(`/api/projects/${id}`);
    return handleApiResponse<Project>(res, i18n.t(`${PROJECTS}:error.loadOne`));
}

export async function createProject(data: CreateProjectData): Promise<{ id: number; name: string }> {
    const res = await apiClient("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return handleApiResponse<{ id: number; name: string }>(res, i18n.t(`${PROJECTS}:error.create`));
}

export async function updateProject(id: number, data: UpdateProjectData): Promise<{ id: number; name: string }> {
    const res = await apiClient(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return handleApiResponse<{ id: number; name: string }>(res, i18n.t(`${PROJECTS}:error.update`));
}

export async function fetchProjectMembers(projectId: number): Promise<Member[]> {
    const res = await apiClient(`/api/projects/${projectId}/members`);
    return handleApiResponse<Member[]>(res, i18n.t(`${projectId}:members.error.load`));
}

export async function addProjectMember(projectId: number, userId: number, role: ProjectMemberRole): Promise<Member> {
    const res = await apiClient(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role })
    });
    return handleApiResponse<Member>(res, i18n.t(`${projectId}:members.error.add`));
}

export async function updateProjectMember(projectId: number, userId: number, role: ProjectMemberRole): Promise<Member> {
    const res = await apiClient(`/api/projects/${projectId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
    });
    return handleApiResponse<Member>(res, i18n.t(`${projectId}:members.error.update`));
}

export async function removeProjectMember(projectId: number, userId: number): Promise<void> {
    const res = await apiClient(`/api/projects/${projectId}/members/${userId}`, {
        method: "DELETE"
    });
    await handleApiResponse<void>(res, i18n.t(`${projectId}:members.error.delete`));
}

export async function deleteProject(id: number): Promise<void> {
    const res = await apiClient(`/api/projects/${id}`, {
        method: "DELETE"
    });
    await handleApiResponse<void>(res, i18n.t(`${PROJECTS}:error.delete`));
}
