import { describe, expectTypeOf, it } from "vitest";

import type { CreateUserData, FetchUsersParams, FetchUsersResponse, UpdateUserData, User } from "./user";

describe("User model types", () => {
    it("User has correct shape", () => {
        const user: User = {
            id: 1,
            login: "admin",
            role: "ADMIN",
            createdAt: "2026-01-01T00:00:00.000Z"
        };

        expectTypeOf(user.id).toBeNumber();
        expectTypeOf(user.login).toBeString();
        expectTypeOf(user.role).toEqualTypeOf<"USER" | "ADMIN">();
        expectTypeOf(user.createdAt).toBeString();
    });

    it("CreateUserData requires login, password and role", () => {
        const data: CreateUserData = {
            login: "newuser",
            password: "secret",
            role: "USER"
        };

        expectTypeOf(data.login).toBeString();
        expectTypeOf(data.password).toBeString();
        expectTypeOf(data.role).toEqualTypeOf<"USER" | "ADMIN">();
    });

    it("UpdateUserData has all optional fields", () => {
        const data: UpdateUserData = {};
        expectTypeOf(data.login).toEqualTypeOf<string | undefined>();
        expectTypeOf(data.password).toEqualTypeOf<string | undefined>();
        expectTypeOf(data.role).toEqualTypeOf<"USER" | "ADMIN" | undefined>();
    });

    it("FetchUsersParams extends PaginationQueryParams with optional filter", () => {
        const params: FetchUsersParams = { page: 1, perPage: 10, filter: "admin" };
        expectTypeOf(params.page).toEqualTypeOf<number | undefined>();
        expectTypeOf(params.filter).toEqualTypeOf<string | undefined>();
    });

    it("FetchUsersResponse contains users array and pagination fields", () => {
        const res: FetchUsersResponse = {
            users: [],
            total: 0,
            page: 1,
            perPage: 10
        };
        expectTypeOf(res.users).toBeArray();
        expectTypeOf(res.total).toBeNumber();
        expectTypeOf(res.page).toBeNumber();
        expectTypeOf(res.perPage).toBeNumber();
    });
});
