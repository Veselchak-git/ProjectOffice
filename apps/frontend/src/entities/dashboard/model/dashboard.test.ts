import { describe, expectTypeOf, it } from "vitest";

import type { ActivityItem, ActivityType, DashboardData, DashboardSummary, ProjectListItem } from "./dashboard";

describe("Dashboard model types", () => {
    it("ActivityType is a strict union", () => {
        expectTypeOf<ActivityType>().toEqualTypeOf<
            | "issue_created"
            | "issue_updated"
            | "issue_deleted"
            | "project_created"
            | "project_updated"
            | "project_deleted"
        >();
    });

    it("DashboardSummary has correct shape", () => {
        const summary: DashboardSummary = {
            totalProjects: 5,
            totalAssigned: 10,
            totalClosed: 3
        };

        expectTypeOf(summary.totalProjects).toBeNumber();
        expectTypeOf(summary.totalAssigned).toBeNumber();
        expectTypeOf(summary.totalClosed).toBeNumber();
        expectTypeOf(summary.totalUsers).toEqualTypeOf<number | undefined>();
    });

    it("ProjectListItem has correct shape", () => {
        const item: ProjectListItem = {
            id: 1,
            name: "Project",
            status: "ACTIVE",
            updatedAt: "2026-01-01T00:00:00.000Z",
            totalIssues: 10,
            openIssues: 3
        };

        expectTypeOf(item.id).toBeNumber();
        expectTypeOf(item.name).toBeString();
        expectTypeOf(item.description).toEqualTypeOf<string | null | undefined>();
        expectTypeOf(item.totalIssues).toBeNumber();
        expectTypeOf(item.openIssues).toBeNumber();
    });

    it("ActivityItem has correct shape", () => {
        const item: ActivityItem = {
            id: 1,
            type: "issue_created",
            timestamp: "2026-01-01T00:00:00.000Z"
        };

        expectTypeOf(item.id).toBeNumber();
        expectTypeOf(item.type).toEqualTypeOf<ActivityType>();
        expectTypeOf(item.projectName).toEqualTypeOf<string | null | undefined>();
        expectTypeOf(item.projectId).toEqualTypeOf<number | null | undefined>();
        expectTypeOf(item.issueId).toEqualTypeOf<number | null | undefined>();
        expectTypeOf(item.issueTitle).toEqualTypeOf<string | null | undefined>();
    });

    it("DashboardData combines summary, projects, activity, and myIssues", () => {
        const data: DashboardData = {
            summary: { totalProjects: 0, totalAssigned: 0, totalClosed: 0 },
            projects: [],
            activity: [],
            myIssues: []
        };

        expectTypeOf(data.summary).toEqualTypeOf<DashboardSummary>();
        expectTypeOf(data.projects).toBeArray();
        expectTypeOf(data.activity).toBeArray();
        expectTypeOf(data.myIssues).toBeArray();
    });
});
