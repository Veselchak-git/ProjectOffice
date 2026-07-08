export interface Project {
    id: number;
    name: string;
    description: string | null;
    status: "ACTIVE" | "ARCHIVED";
    versionCount: number;
    taskCount: number;
    responsible: string;
    createdAt: string;
}
