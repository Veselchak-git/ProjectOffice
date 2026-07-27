import { describe, expectTypeOf, it } from "vitest";

import type {
    CreateProjectData,
    FetchProjectsParams,
    Member,
    Project,
    ProjectMemberRole,
    ProjectVersion,
    UpdateProjectData
} from "./project";

describe("Project model types", () => {
    it("Project has correct shape", () => {
        const project: Project = {
            id: 1,
            name: "My Project",
            description: "Description",
            status: "ACTIVE",
            versionCount: 1,
            versions: [],
            taskCount: 0,
            responsible: "admin",
            createdAt: "2026-01-01T00:00:00.000Z"
        };

        expectTypeOf(project.id).toBeNumber();
        expectTypeOf(project.name).toBeString();
        expectTypeOf(project.description).toEqualTypeOf<string | null>();
        expectTypeOf(project.status).toEqualTypeOf<"ACTIVE" | "ARCHIVED">();
        expectTypeOf(project.versions).toBeArray();
        expectTypeOf(project.members).toEqualTypeOf<Member[] | undefined>();
        expectTypeOf(project.myRole).toEqualTypeOf<ProjectMemberRole | undefined>();
    });

    it("ProjectMemberRole is a strict union", () => {
        expectTypeOf<ProjectMemberRole>().toEqualTypeOf<"VIEWER" | "REPORTER" | "UPDATER" | "DEVELOPER" | "MANAGER">();
    });

    it("Member has userId, login, and role", () => {
        const member: Member = { userId: 1, login: "user1", role: "DEVELOPER" };
        expectTypeOf(member.userId).toBeNumber();
        expectTypeOf(member.login).toBeString();
        expectTypeOf(member.role).toEqualTypeOf<ProjectMemberRole>();
    });

    it("ProjectVersion has id and version", () => {
        const ver: ProjectVersion = { id: 1, version: "1.0.0" };
        expectTypeOf(ver.id).toBeNumber();
        expectTypeOf(ver.version).toBeString();
    });

    it("CreateProjectData requires name, optional description and versions", () => {
        const data: CreateProjectData = { name: "New" };
        expectTypeOf(data.name).toBeString();
        expectTypeOf(data.description).toEqualTypeOf<string | undefined>();
        expectTypeOf(data.versions).toEqualTypeOf<string[] | undefined>();
    });

    it("UpdateProjectData has all optional fields", () => {
        const data: UpdateProjectData = {};
        expectTypeOf(data.name).toEqualTypeOf<string | undefined>();
        expectTypeOf(data.description).toEqualTypeOf<string | null | undefined>();
        expectTypeOf(data.status).toEqualTypeOf<"ACTIVE" | "ARCHIVED" | undefined>();
    });

    it("FetchProjectsParams has filter and pagination", () => {
        const params: FetchProjectsParams = { filter: "test", page: 1 };
        expectTypeOf(params.filter).toEqualTypeOf<string | undefined>();
        expectTypeOf(params.page).toEqualTypeOf<number | undefined>();
    });
});
