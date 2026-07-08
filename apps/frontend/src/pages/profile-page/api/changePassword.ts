import type { ChangePasswordFormValues } from "../model/change-password-form";

export async function changePasswordRequest(data: ChangePasswordFormValues): Promise<void> {
    const token = localStorage.getItem("accessToken");
    const res = await fetch("/api/auth/me/password", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
