import { describe, expectTypeOf, it } from "vitest";

import type {
    CreateIssueData,
    FetchIssuesParams,
    Issue,
    IssueCategory,
    IssuePriority,
    IssueStatus,
    Reproducibility,
    UpdateIssueData
} from "./issue";

describe("Issue model types", () => {
    it("Issue has correct shape", () => {
        const issue: Issue = {
            id: 1,
            title: "Bug",
            projectId: 1,
            projectName: "Project",
            category: "BUG",
            priority: "CRITICAL",
            reproducibility: "ALWAYS",
            productVersionId: null,
            productVersion: null,
            description: null,
            additionalInfo: null,
            status: "NEW",
            assigneeId: null,
            assigneeLogin: null,
            reporterId: 1,
            reporterLogin: "admin",
            solution: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
        };

        expectTypeOf(issue.id).toBeNumber();
        expectTypeOf(issue.title).toBeString();
        expectTypeOf(issue.category).toEqualTypeOf<IssueCategory>();
        expectTypeOf(issue.priority).toEqualTypeOf<IssuePriority>();
        expectTypeOf(issue.status).toEqualTypeOf<IssueStatus>();
        expectTypeOf(issue.reproducibility).toEqualTypeOf<Reproducibility | null>();
    });

    it("IssueCategory is a strict union", () => {
        expectTypeOf<IssueCategory>().toEqualTypeOf<"BUG" | "FEATURE" | "TASK" | "IMPROVEMENT" | "QUESTION">();
    });

    it("IssuePriority is a strict union", () => {
        expectTypeOf<IssuePriority>().toEqualTypeOf<"CRITICAL" | "SERIOUS" | "MINOR" | "GENERAL">();
    });

    it("IssueStatus is a strict union", () => {
        expectTypeOf<IssueStatus>().toEqualTypeOf<
            "NEW" | "ACKNOWLEDGED" | "CONFIRMED" | "ASSIGNED" | "RESOLVED" | "CLOSED"
        >();
    });

    it("Reproducibility is a strict union", () => {
        expectTypeOf<Reproducibility>().toEqualTypeOf<
            "ALWAYS" | "SOMETIMES" | "RANDOMLY" | "NOT_REPRODUCIBLE" | "NOT_ATTEMPTED"
        >();
    });

    it("CreateIssueData requires title, category and priority", () => {
        const data: CreateIssueData = {
            title: "New issue",
            category: "BUG",
            priority: "MINOR"
        };
        expectTypeOf(data.title).toBeString();
        expectTypeOf(data.reproducibility).toEqualTypeOf<Reproducibility | undefined>();
        expectTypeOf(data.description).toEqualTypeOf<string | undefined>();
    });

    it("UpdateIssueData has all optional fields", () => {
        const data: UpdateIssueData = {};
        expectTypeOf(data.title).toEqualTypeOf<string | undefined>();
        expectTypeOf(data.status).toEqualTypeOf<IssueStatus | undefined>();
        expectTypeOf(data.solution).toEqualTypeOf<string | null | undefined>();
    });

    it("FetchIssuesParams has optional filter and pagination", () => {
        const params: FetchIssuesParams = { filter: "bug", page: 1, perPage: 25 };
        expectTypeOf(params.filter).toEqualTypeOf<string | undefined>();
        expectTypeOf(params.page).toEqualTypeOf<number | undefined>();
    });
});
