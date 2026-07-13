import { apiClient } from "@/shared/lib/auth";
import { i18n } from "@/shared/lib/i18n";

import type { CreateUserData, FetchUsersParams, FetchUsersResponse, UpdateUserData, User } from "../model/users";

export async function fetchUsers(params?: FetchUsersParams): Promise<FetchUsersResponse> {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set("q", params.q);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.perPage) searchParams.set("perPage", String(params.perPage));
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

    const query = searchParams.toString();
    const res = await apiClient(`/api/users${query ? `?${query}` : ""}`);

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? i18n.t("users:error.loading"));
    }

    return res.json();
}

export async function createUser(data: CreateUserData): Promise<User> {
    const res = await apiClient("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? i18n.t("users:error.create"));
    }

    return res.json();
}

export async function deleteUser(id: number): Promise<void> {
    const res = await apiClient(`/api/users/${id}`, {
        method: "DELETE"
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? i18n.t("users:error.delete"));
    }
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

    if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? i18n.t("users:error.update"));
    }

    return res.json();
}
