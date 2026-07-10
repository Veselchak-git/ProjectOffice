import { apiClient } from "@/shared/lib/auth/api-client";

import type { CreateUserData, UpdateUserRoleData, User } from "../model/users";

export async function fetchUsers(): Promise<User[]> {
    const res = await apiClient("/api/users");

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
