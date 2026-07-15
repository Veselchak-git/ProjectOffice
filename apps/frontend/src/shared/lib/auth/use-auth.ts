import { NS } from "@helpdesk-portal/i18n";
import { useCallback } from "react";

import { i18n } from "@/shared/lib/i18n";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";

import { apiClient } from "./api-client";
import { loginSuccess, logoutAction, selectAuthLoading, selectAuthUser, setLoading, setUser } from "./auth-slice";
import { setToken } from "./token-store";

export function useAuth() {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectAuthUser);
    const loading = useAppSelector(selectAuthLoading);

    const login = useCallback(
        async (loginArg: string, password: string) => {
            const res = await apiClient("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login: loginArg, password })
            });

            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.message ?? i18n.t(`${NS.auth}:error.invalidCredentials`));
            }

            const body = await res.json();
            setToken(body.accessToken);
            dispatch(loginSuccess({ user: body.user, accessToken: body.accessToken }));
        },
        [dispatch]
    );

    const logout = useCallback(async () => {
        try {
            await apiClient("/api/auth/logout", { method: "POST" });
        } catch {
            // ignore
        }
        setToken(null);
        dispatch(logoutAction());
    }, [dispatch]);

    return { user, loading, login, logout };
}

export async function initAuth(dispatch: AppDispatch) {
    try {
        const res = await apiClient("/api/auth/me");

        if (res.ok) {
            const data = await res.json();
            dispatch(setUser(data.user));
        }
    } catch {
        // not authenticated
    } finally {
        dispatch(setLoading(false));
    }
}
