import type { Issue } from "@/entities/issue";

export type ActivityType =
    | "issue_created"
    | "issue_updated"
    | "issue_deleted"
    | "project_created"
    | "project_updated"
    | "project_deleted";

export interface ProjectListItem {
    id: number;
    name: string;
    status: string;
    description?: string | null;
    updatedAt: string;
    totalIssues: number;
    openIssues: number;
}

export interface ActivityItem {
    id: number;
    type: ActivityType;
    timestamp: string;
    projectName?: string | null;
    projectId?: number | null;
    issueId?: number | null;
    issueTitle?: string | null;
}

export interface DashboardSummary {
    totalProjects: number;
    totalAssigned: number;
    totalClosed: number;
    totalUsers?: number;
}

export interface DashboardData {
    summary: DashboardSummary;
    projects: ProjectListItem[];
    activity: ActivityItem[];
    myIssues: Issue[];
}
