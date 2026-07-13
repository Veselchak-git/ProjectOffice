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
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set("q", params.q);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.perPage) searchParams.set("perPage", String(params.perPage));
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

    const query = searchParams.toString();
    const res = await apiClient(`/api/projects${query ? `?${query}` : ""}`);

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? i18n.t("projects:error.loading"));
    }

    return res.json();
}

export async function fetchProject(id: number): Promise<Project> {
    const res = await apiClient(`/api/projects/${id}`);

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? i18n.t("projects:error.loadOne"));
    }

    return res.json();
}

export async function createProject(data: CreateProjectData): Promise<{ id: number; name: string }> {
    const res = await apiClient("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? i18n.t("projects:error.create"));
    }

    return res.json();
}

export async function updateProject(id: number, data: UpdateProjectData): Promise<{ id: number; name: string }> {
    const res = await apiClient(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? i18n.t("projects:error.update"));
    }

    return res.json();
}

export async function fetchProjectMembers(projectId: number): Promise<Member[]> {
    const res = await apiClient(`/api/projects/${projectId}/members`);

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? i18n.t("projects:members.error.load"));
    }

    return res.json();
}

export async function addProjectMember(projectId: number, userId: number, role: ProjectMemberRole): Promise<Member> {
    const res = await apiClient(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role })
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? i18n.t("projects:members.error.add"));
    }

    return res.json();
}

export async function updateProjectMember(projectId: number, userId: number, role: ProjectMemberRole): Promise<Member> {
    const res = await apiClient(`/api/projects/${projectId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? i18n.t("projects:members.error.update"));
    }

    return res.json();
}

export async function removeProjectMember(projectId: number, userId: number): Promise<void> {
    const res = await apiClient(`/api/projects/${projectId}/members/${userId}`, {
        method: "DELETE"
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? i18n.t("projects:members.error.delete"));
    }
}

export async function deleteProject(id: number): Promise<void> {
    const res = await apiClient(`/api/projects/${id}`, {
        method: "DELETE"
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? i18n.t("projects:error.delete"));
    }
}
