import type { PaginationQueryParams } from "@/shared/lib/api";

export interface AuditLog {
    id: number;
    eventType: string;
    subjectType: string;
    objectType: string;
    subjectId: number;
    objectId: number;
    oldValue: string | null;
    newValue: string | null;
    subjectLogin: string;
    createdAt: string;
}

export type FetchAuditLogsParams = PaginationQueryParams & {
    filter?: string;
};
