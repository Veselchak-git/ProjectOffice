import type { PaginationQueryParams } from "@/shared/lib/api";

export type IssueCategory = "BUG" | "FEATURE" | "TASK" | "IMPROVEMENT" | "QUESTION";
export type IssuePriority = "CRITICAL" | "SERIOUS" | "MINOR" | "GENERAL";
export type Reproducibility = "ALWAYS" | "SOMETIMES" | "RANDOMLY" | "NOT_REPRODUCIBLE" | "NOT_ATTEMPTED";
export type IssueStatus = "NEW" | "ACKNOWLEDGED" | "CONFIRMED" | "ASSIGNED" | "RESOLVED" | "CLOSED";

export interface Issue {
    id: number;
    title: string;
    projectId: number;
    projectName: string;
    category: IssueCategory;
    priority: IssuePriority;
    reproducibility: Reproducibility | null;
    productVersionId: number | null;
    productVersion: string | null;
    description: string | null;
    additionalInfo: string | null;
    status: IssueStatus;
    assigneeId: number | null;
    assigneeLogin: string | null;
    reporterId: number;
    reporterLogin: string;
    solution: string | null;
    myRole?: string;
    createdAt: string;
    updatedAt: string;
}

export interface FetchIssuesParams extends PaginationQueryParams {
    filter?: string;
}

export interface CreateIssueData {
    title: string;
    category: IssueCategory;
    priority: IssuePriority;
    reproducibility?: Reproducibility;
    productVersionId?: number | null;
    description?: string;
    additionalInfo?: string;
    assigneeId?: number | null;
}

export interface UpdateIssueData {
    title?: string;
    category?: IssueCategory;
    priority?: IssuePriority;
    reproducibility?: Reproducibility | null;
    productVersionId?: number | null;
    description?: string | null;
    additionalInfo?: string | null;
    status?: IssueStatus;
    assigneeId?: number | null;
    solution?: string | null;
}
