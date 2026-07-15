import type { VisibilityState } from "@tanstack/react-table";

import { apiClient } from "@/shared/lib/auth";

export interface TableSettings {
    columnVisibility: VisibilityState;
    columnOrder: string[];
}

export async function fetchUserPreference(page: string): Promise<TableSettings | null> {
    const res = await apiClient(`/api/users/me/preferences?page=${encodeURIComponent(page)}`);

    if (!res.ok) {
        return null;
    }

    const data = (await res.json()) as { settings?: TableSettings };
    return data.settings ?? null;
}

export async function saveUserPreference(page: string, settings: TableSettings): Promise<void> {
    await apiClient("/api/users/me/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, settings })
    });
}
