import { beforeEach, describe, expect, it, vi } from "vitest";

import * as apiUtils from "@/shared/lib/api";
import { apiClient } from "@/shared/lib/auth";

import { createUser, deleteUser, fetchAllUsers, fetchUsers, updateUser } from "./users";

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

describe("user API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiUtils.buildQueryString).mockReturnValue("");
        vi.mocked(apiUtils.handleApiResponse).mockImplementation(async (res: Response) => res.json());
    });

    describe("fetchAllUsers", () => {
        it("calls GET /api/users and returns users array", async () => {
            const users = [{ id: 1, login: "admin", role: "ADMIN", createdAt: "2026-01-01" }];
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse({ users }));

            const result = await fetchAllUsers();

            expect(apiClient).toHaveBeenCalledWith("/api/users");
            expect(result).toEqual(users);
        });
    });

    describe("fetchUsers", () => {
        it("calls GET /api/users with query string from params", async () => {
            vi.mocked(apiUtils.buildQueryString).mockReturnValue("?page=1&perPage=10");
            const response = { users: [], total: 0, page: 1, perPage: 10 };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(response));

            const result = await fetchUsers({ page: 1, perPage: 10 });

            expect(apiUtils.buildQueryString).toHaveBeenCalledWith({ page: 1, perPage: 10 });
            expect(apiClient).toHaveBeenCalledWith("/api/users?page=1&perPage=10");
            expect(result).toEqual(response);
        });

        it("calls GET /api/users without query when no params", async () => {
            const response = { users: [], total: 0, page: 1, perPage: 10 };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(response));

            await fetchUsers();

            expect(apiClient).toHaveBeenCalledWith("/api/users");
        });
    });

    describe("createUser", () => {
        it("calls POST /api/users with JSON body", async () => {
            const userData = { login: "new", password: "pass", role: "USER" as const };
            const created = { id: 2, ...userData, createdAt: "2026-01-01" };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(created));

            const result = await createUser(userData);

            expect(apiClient).toHaveBeenCalledWith("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });
            expect(result).toEqual(created);
        });
    });

    describe("deleteUser", () => {
        it("calls DELETE /api/users/:id", async () => {
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(undefined));

            await deleteUser(42);

            expect(apiClient).toHaveBeenCalledWith("/api/users/42", { method: "DELETE" });
        });
    });

    describe("updateUser", () => {
        it("calls PATCH /api/users/:id with only defined fields", async () => {
            const updated = { id: 1, login: "updated", role: "ADMIN" as const, createdAt: "2026-01-01" };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(updated));

            const result = await updateUser(1, { login: "updated", role: "ADMIN" });

            expect(apiClient).toHaveBeenCalledWith("/api/users/1", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login: "updated", role: "ADMIN" })
            });
            expect(result).toEqual(updated);
        });

        it("skips empty password string in body", async () => {
            const updated = { id: 1, login: "user", role: "USER" as const, createdAt: "2026-01-01" };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(updated));

            await updateUser(1, { password: "" });

            const callBody = JSON.parse(vi.mocked(apiClient).mock.calls[0]![1]?.body as string);
            expect(callBody).not.toHaveProperty("password");
        });

        it("includes password when non-empty", async () => {
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse({}));

            await updateUser(1, { password: "newpass" });

            const callBody = JSON.parse(vi.mocked(apiClient).mock.calls[0]![1]?.body as string);
            expect(callBody).toEqual({ password: "newpass" });
        });
    });
});
