import { beforeEach, describe, expect, it, vi } from "vitest";

import * as apiUtils from "@/shared/lib/api";
import { apiClient } from "@/shared/lib/auth";

import {
    addProjectMember,
    createProject,
    deleteProject,
    fetchProject,
    fetchProjectMembers,
    fetchProjects,
    removeProjectMember,
    updateProject,
    updateProjectMember
} from "./projects";

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

describe("project API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiUtils.buildQueryString).mockReturnValue("");
        vi.mocked(apiUtils.handleApiResponse).mockImplementation(async (res: Response) => res.json());
    });

    describe("fetchProjects", () => {
        it("calls GET /api/projects and returns response", async () => {
            const response = { projects: [], total: 0, active: 0, page: 1, perPage: 10 };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(response));

            const result = await fetchProjects();

            expect(apiClient).toHaveBeenCalledWith("/api/projects");
            expect(result).toEqual(response);
        });

        it("appends query string from params", async () => {
            vi.mocked(apiUtils.buildQueryString).mockReturnValue("?page=2&filter=test");
            vi.mocked(apiClient).mockResolvedValue(
                mockOkResponse({ projects: [], total: 0, active: 0, page: 2, perPage: 10 })
            );

            await fetchProjects({ page: 2, filter: "test" });

            expect(apiClient).toHaveBeenCalledWith("/api/projects?page=2&filter=test");
        });
    });

    describe("fetchProject", () => {
        it("calls GET /api/projects/:id", async () => {
            const project = { id: 1, name: "Test", status: "ACTIVE" };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(project));

            const result = await fetchProject(1);

            expect(apiClient).toHaveBeenCalledWith("/api/projects/1");
            expect(result).toEqual(project);
        });
    });

    describe("createProject", () => {
        it("calls POST /api/projects with JSON body", async () => {
            const data = { name: "New Project", description: "Desc" };
            const created = { id: 1, name: "New Project" };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(created));

            const result = await createProject(data);

            expect(apiClient).toHaveBeenCalledWith("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            expect(result).toEqual(created);
        });
    });

    describe("updateProject", () => {
        it("calls PATCH /api/projects/:id with JSON body", async () => {
            const data = { name: "Updated" };
            const updated = { id: 1, name: "Updated" };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(updated));

            const result = await updateProject(1, data);

            expect(apiClient).toHaveBeenCalledWith("/api/projects/1", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            expect(result).toEqual(updated);
        });
    });

    describe("deleteProject", () => {
        it("calls DELETE /api/projects/:id", async () => {
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(undefined));

            await deleteProject(5);

            expect(apiClient).toHaveBeenCalledWith("/api/projects/5", { method: "DELETE" });
        });
    });

    describe("fetchProjectMembers", () => {
        it("calls GET /api/projects/:projectId/members", async () => {
            const members = [{ userId: 1, login: "user1", role: "DEVELOPER" }];
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(members));

            const result = await fetchProjectMembers(1);

            expect(apiClient).toHaveBeenCalledWith("/api/projects/1/members");
            expect(result).toEqual(members);
        });
    });

    describe("addProjectMember", () => {
        it("calls POST /api/projects/:projectId/members with userId and role", async () => {
            const member = { userId: 2, login: "user2", role: "REPORTER" };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(member));

            const result = await addProjectMember(1, 2, "REPORTER");

            expect(apiClient).toHaveBeenCalledWith("/api/projects/1/members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: 2, role: "REPORTER" })
            });
            expect(result).toEqual(member);
        });
    });

    describe("updateProjectMember", () => {
        it("calls PATCH /api/projects/:projectId/members/:userId with role", async () => {
            const member = { userId: 2, login: "user2", role: "MANAGER" };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(member));

            const result = await updateProjectMember(1, 2, "MANAGER");

            expect(apiClient).toHaveBeenCalledWith("/api/projects/1/members/2", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: "MANAGER" })
            });
            expect(result).toEqual(member);
        });
    });

    describe("removeProjectMember", () => {
        it("calls DELETE /api/projects/:projectId/members/:userId", async () => {
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(undefined));

            await removeProjectMember(1, 2);

            expect(apiClient).toHaveBeenCalledWith("/api/projects/1/members/2", { method: "DELETE" });
        });
    });
});
