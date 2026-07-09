export interface Member {
    userId: number;
    login: string;
    role: string;
}

export interface Project {
    id: number;
    name: string;
    description: string | null;
    status: "ACTIVE" | "ARCHIVED";
    versionCount: number;
    versions: string[];
    taskCount: number;
    responsible: string;
    members?: Member[];
    createdAt: string;
}

export interface CreateProjectData {
    name: string;
    description?: string;
    versions?: string[];
}

export interface UpdateProjectData {
    name?: string;
    description?: string | null;
    status?: "ACTIVE" | "ARCHIVED";
    versions?: string[];
}

export interface User {
    id: number;
    login: string;
    role: string;
}
