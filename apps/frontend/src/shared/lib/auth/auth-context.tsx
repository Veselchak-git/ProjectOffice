/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useEffect, type FC, type PropsWithChildren } from "react";

import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";

import { apiClient } from "./api-client";
import { loginSuccess, logoutAction, setLoading, setUser } from "./auth-slice";
import { getToken, setToken } from "./token-store";

export interface AuthState {
    user: {
        id: string;
        login: string;
        role: string;
    } | null;
    loading: boolean;
    login: (loginArg: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
    user: null,
    loading: true,
    login: async () => {},
    logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.auth.user);
    const loading = useAppSelector(state => state.auth.loading);

    const initAuth = useCallback(async () => {
        try {
            const existingToken = getToken();

            if (existingToken) {
                const meRes = await apiClient("/api/auth/me", {
                    headers: { Authorization: `Bearer ${existingToken}` },
                });

                if (meRes.ok) {
                    const data = await meRes.json();
                    dispatch(setUser(data.user));
                    dispatch(setLoading(false));
                    return;
                }
            }

            const refreshRes = await apiClient("/api/auth/refresh", { method: "POST" });
            if (!refreshRes.ok) {
                dispatch(setLoading(false));
                return;
            }

            const { accessToken } = await refreshRes.json();
            setToken(accessToken);

            const meRes = await apiClient("/api/auth/me", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (meRes.ok) {
                const data = await meRes.json();
                dispatch(setUser(data.user));
            }
        } catch {
            // not authenticated
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    const login = useCallback(async (loginArg: string, password: string) => {
        const res = await apiClient("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login: loginArg, password }),
        });

        if (!res.ok) {
            const body = await res.json().catch(() => null);
            throw new Error(body?.message ?? "Неверный логин или пароль");
        }

        const body = await res.json();
        setToken(body.accessToken);
        dispatch(loginSuccess({ user: body.user, accessToken: body.accessToken }));
    }, [dispatch]);

    const logout = useCallback(async () => {
        try {
            await apiClient("/api/auth/logout", { method: "POST" });
        } catch {
            // ignore
        }
        setToken(null);
        dispatch(logoutAction());
    }, [dispatch]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
