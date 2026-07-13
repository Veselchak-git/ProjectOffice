export type ProjectMemberRole =
    | "VIEWER"
    | "REPORTER"
    | "UPDATER"
    | "DEVELOPER"
    | "MANAGER";

export interface Member {
    userId: number;
    login: string;
    role: ProjectMemberRole;
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
    myRole?: ProjectMemberRole;
}

export interface FetchProjectsParams {
    q?: string;
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
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


