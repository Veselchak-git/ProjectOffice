import type { Project } from "../model/project";

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
