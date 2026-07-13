import { apiClient } from "@/shared/lib/auth";
import { i18n } from "@/shared/lib/i18n";

import type { User } from "../model/user";

export async function fetchUsers(): Promise<User[]> {
    const res = await apiClient("/api/users");

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? i18n.t("users:error.loading"));
    }

    const data = (await res.json()) as { users: User[] };
    return data.users;
}
