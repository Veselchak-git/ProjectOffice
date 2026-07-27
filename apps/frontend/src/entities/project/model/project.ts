import type { PaginationQueryParams } from "@/shared/lib/api";

export type ProjectMemberRole = "VIEWER" | "REPORTER" | "UPDATER" | "DEVELOPER" | "MANAGER";

export interface Member {
    userId: number;
    login: string;
    role: ProjectMemberRole;
}

export interface ProjectVersion {
    id: number;
    version: string;
}

export interface Project {
    id: number;
    name: string;
    description: string | null;
    status: "ACTIVE" | "ARCHIVED";
    versionCount: number;
    versions: ProjectVersion[];
    taskCount: number;
    responsible: string;
    members?: Member[];
    createdAt: string;
    myRole?: ProjectMemberRole;
}

export type FetchProjectsParams = PaginationQueryParams & {
    filter?: string;
};

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
