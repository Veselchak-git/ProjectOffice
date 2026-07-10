import { apiClient } from "@/shared/lib/auth";

import type { CreateUserData, FetchUsersParams, FetchUsersResponse, UpdateUserRoleData, User } from "../model/users";

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
        throw new Error(body?.message ?? "Ошибка загрузки пользователей");
    }

    return res.json();
}

export async function createUser(data: CreateUserData): Promise<User> {
    const res = await apiClient("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Ошибка создания пользователя");
    }

    return res.json();
}

export async function deleteUser(id: number): Promise<void> {
    const res = await apiClient(`/api/users/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Ошибка удаления пользователя");
    }
}

export async function updateUserRole(id: number, data: UpdateUserRoleData): Promise<User> {
    const res = await apiClient(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Ошибка обновления роли");
    }

    return res.json();
}
