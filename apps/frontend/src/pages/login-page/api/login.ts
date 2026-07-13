import { apiClient } from "@/shared/lib/auth";
import { i18n } from "@/shared/lib/i18n";

import type { LoginFormValues } from "../model/login-form";

interface LoginResponse {
    accessToken: string;
    expiresIn: number;
    user: unknown;
}

export async function loginRequest(data: LoginFormValues): Promise<LoginResponse> {
    const res = await apiClient("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? i18n.t("auth:error.invalidCredentials"));
    }

    const body: LoginResponse = await res.json();
    return body;
}
