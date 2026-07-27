import { beforeEach, describe, expect, it, vi } from "vitest";

import * as apiUtils from "@/shared/lib/api";
import { apiClient } from "@/shared/lib/auth";

import { createIssue, deleteIssue, fetchIssue, fetchIssues, fetchProjectIssues, updateIssue } from "./issues";

vi.mock("@/shared/lib/api", () => ({
    buildQueryString: vi.fn(),
    handleApiResponse: vi.fn()
}));

vi.mock("@/shared/lib/auth", () => ({
    apiClient: vi.fn()
}));

function mockOkResponse(data: unknown): Response {
    return { ok: true, json: () => Promise.resolve(data) } as Response;
}

describe("issue API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiUtils.buildQueryString).mockReturnValue("");
        vi.mocked(apiUtils.handleApiResponse).mockImplementation(async (res: Response) => res.json());
    });

    describe("fetchIssues", () => {
        it("calls GET /api/issues and returns response", async () => {
            const response = { issues: [], total: 0, page: 1, perPage: 10 };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(response));

            const result = await fetchIssues();

            expect(apiClient).toHaveBeenCalledWith("/api/issues");
            expect(result).toEqual(response);
        });

        it("appends query string from params", async () => {
            vi.mocked(apiUtils.buildQueryString).mockReturnValue("?page=2");
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse({ issues: [], total: 0, page: 2, perPage: 10 }));

            await fetchIssues({ page: 2 });

            expect(apiClient).toHaveBeenCalledWith("/api/issues?page=2");
        });
    });

    describe("fetchIssue", () => {
        it("calls GET /api/issues/:id", async () => {
            const issue = { id: 5, title: "Bug", status: "NEW" };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(issue));

            const result = await fetchIssue(5);

            expect(apiClient).toHaveBeenCalledWith("/api/issues/5");
            expect(result).toEqual(issue);
        });
    });

    describe("fetchProjectIssues", () => {
        it("calls GET /api/projects/:projectId/issues", async () => {
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse({ issues: [], total: 0, page: 1, perPage: 10 }));

            await fetchProjectIssues(3);

            expect(apiClient).toHaveBeenCalledWith("/api/projects/3/issues");
        });

        it("appends query string to project issues URL", async () => {
            vi.mocked(apiUtils.buildQueryString).mockReturnValue("?filter=bug");
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse({ issues: [], total: 0, page: 1, perPage: 10 }));

            await fetchProjectIssues(3, { filter: "bug" });

            expect(apiClient).toHaveBeenCalledWith("/api/projects/3/issues?filter=bug");
        });
    });

    describe("createIssue", () => {
        it("calls POST /api/projects/:projectId/issues with JSON body", async () => {
            const data = { title: "New bug", category: "BUG" as const, priority: "MINOR" as const };
            const created = { id: 1, ...data, status: "NEW" };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(created));

            const result = await createIssue(2, data);

            expect(apiClient).toHaveBeenCalledWith("/api/projects/2/issues", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            expect(result).toEqual(created);
        });
    });

    describe("updateIssue", () => {
        it("calls PATCH /api/issues/:id with JSON body", async () => {
            const data = { status: "CONFIRMED" as const };
            const updated = { id: 1, title: "Bug", ...data };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(updated));

            const result = await updateIssue(1, data);

            expect(apiClient).toHaveBeenCalledWith("/api/issues/1", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            expect(result).toEqual(updated);
        });
    });

    describe("deleteIssue", () => {
        it("calls DELETE /api/issues/:id", async () => {
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(undefined));

            await deleteIssue(7);

            expect(apiClient).toHaveBeenCalledWith("/api/issues/7", { method: "DELETE" });
        });
    });
});
