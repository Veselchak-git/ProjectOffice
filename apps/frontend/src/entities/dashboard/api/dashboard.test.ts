import { beforeEach, describe, expect, it, vi } from "vitest";

import * as apiUtils from "@/shared/lib/api";
import { apiClient } from "@/shared/lib/auth";

import { fetchDashboard } from "./dashboard";

vi.mock("@/shared/lib/api", () => ({
    handleApiResponse: vi.fn()
}));

vi.mock("@/shared/lib/auth", () => ({
    apiClient: vi.fn()
}));

function mockOkResponse(data: unknown): Response {
    return { ok: true, json: () => Promise.resolve(data) } as Response;
}

describe("dashboard API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiUtils.handleApiResponse).mockImplementation(async (res: Response) => res.json());
    });

    describe("fetchDashboard", () => {
        it("calls GET /api/dashboard and returns DashboardData", async () => {
            const dashboardData = {
                summary: { totalProjects: 5, totalAssigned: 10, totalClosed: 3 },
                projects: [],
                activity: [],
                myIssues: []
            };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(dashboardData));

            const result = await fetchDashboard();

            expect(apiClient).toHaveBeenCalledWith("/api/dashboard");
            expect(result).toEqual(dashboardData);
        });

        it("returns full dashboard data with all sections", async () => {
            const project = {
                id: 1,
                name: "P1",
                status: "ACTIVE",
                updatedAt: "2026-01-01",
                totalIssues: 5,
                openIssues: 2
            };
            const activity = { id: 1, type: "issue_created", timestamp: "2026-01-01" };
            const issue = {
                id: 1,
                title: "Bug",
                projectId: 1,
                projectName: "P1",
                category: "BUG",
                priority: "MINOR",
                reproducibility: null,
                productVersionId: null,
                productVersion: null,
                description: null,
                additionalInfo: null,
                status: "NEW",
                assigneeId: 1,
                assigneeLogin: "user",
                reporterId: 1,
                reporterLogin: "admin",
                solution: null,
                createdAt: "2026-01-01",
                updatedAt: "2026-01-01"
            };
            const dashboardData = {
                summary: { totalProjects: 1, totalAssigned: 1, totalClosed: 0 },
                projects: [project],
                activity: [activity],
                myIssues: [issue]
            };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(dashboardData));

            const result = await fetchDashboard();

            expect(result.projects).toHaveLength(1);
            expect(result.activity).toHaveLength(1);
            expect(result.myIssues).toHaveLength(1);
            expect(result.summary.totalProjects).toBe(1);
        });
    });
});
