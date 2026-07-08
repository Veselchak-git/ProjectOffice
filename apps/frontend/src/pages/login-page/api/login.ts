import type { LoginFormValues } from "../model/login-form";

interface LoginResponse {
    accessToken: string;
    expiresIn: number;
    user: unknown;
}

export async function loginRequest(data: LoginFormValues): Promise<LoginResponse> {
    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Неверный логин или пароль");
    }

    const body: LoginResponse = await res.json();
    return body;
}
