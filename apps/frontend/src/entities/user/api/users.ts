import { NS } from "@helpdesk-portal/i18n";

import { buildQueryString, handleApiResponse } from "@/shared/lib/api";
import { apiClient } from "@/shared/lib/auth";
import { i18n } from "@/shared/lib/i18n";

import type { CreateUserData, FetchUsersParams, FetchUsersResponse, UpdateUserData, User } from "../model/user";

export async function fetchAllUsers(): Promise<User[]> {
    const res = await apiClient("/api/users");
    const data = await handleApiResponse<{ users: User[] }>(res, i18n.t(`${NS.users}:error.loading`));
    return data.users;
}

export async function fetchUsers(params?: FetchUsersParams): Promise<FetchUsersResponse> {
    const query = buildQueryString(params);
    const res = await apiClient(`/api/users${query}`);
    return handleApiResponse<FetchUsersResponse>(res, i18n.t(`${NS.users}:error.loading`));
}

export async function createUser(data: CreateUserData): Promise<User> {
    const res = await apiClient("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return handleApiResponse<User>(res, i18n.t(`${NS.users}:error.create`));
}

export async function deleteUser(id: number): Promise<void> {
    const res = await apiClient(`/api/users/${id}`, {
        method: "DELETE"
    });
    await handleApiResponse<void>(res, i18n.t(`${NS.users}:error.delete`));
}

export async function updateUser(id: number, data: UpdateUserData): Promise<User> {
    const body: Record<string, unknown> = {};
    if (data.login !== undefined) body.login = data.login;
    if (data.password !== undefined && data.password !== "") body.password = data.password;
    if (data.role !== undefined) body.role = data.role;

    const res = await apiClient(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    return handleApiResponse<User>(res, i18n.t(`${NS.users}:error.update`));
}
