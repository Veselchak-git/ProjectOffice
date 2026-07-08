import type { CreateProjectData, Project, UpdateProjectData } from "../model/project";

export interface FetchProjectsResponse {
    projects: Project[];
    total: number;
    active: number;
}

export async function fetchProjects(): Promise<FetchProjectsResponse> {
    const res = await fetch("/api/projects");

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Ошибка загрузки проектов");
    }

    return res.json();
}

export async function fetchProject(id: number): Promise<Project> {
    const res = await fetch(`/api/projects/${id}`);

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Ошибка загрузки проекта");
    }

    return res.json();
}

export async function createProject(data: CreateProjectData): Promise<{ id: number; name: string }> {
    const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Ошибка создания проекта");
    }

    return res.json();
}

export async function updateProject(id: number, data: UpdateProjectData): Promise<{ id: number; name: string }> {
    const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Ошибка обновления проекта");
    }

    return res.json();
}
