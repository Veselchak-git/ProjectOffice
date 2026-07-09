import { apiClient } from "@/shared/lib/auth/api-client";

import type { ChangePasswordFormValues } from "../model/change-password-form";

export async function changePasswordRequest(data: ChangePasswordFormValues): Promise<void> {
    const res = await apiClient("/api/auth/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
        }),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Ошибка при смене пароля");
    }
}
