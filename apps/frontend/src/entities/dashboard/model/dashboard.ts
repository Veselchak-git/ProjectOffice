import type { Issue } from "@/entities/issue";

export type ActivityType = "issue_created" | "status_changed" | "assigned";

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
    message: string;
    timestamp: string;
    projectName?: string | null;
    issueId?: number | null;
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
