import { getToken, setToken } from "./token-store";

let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(fn: () => void) {
    onSessionExpired = fn;
}

async function fetchWithAuth(url: string, options: RequestInit | undefined, token: string | null): Promise<Response> {
    return fetch(url, {
        ...options,
        credentials: "include",
        headers: {
            ...options?.headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    });
}

export async function apiClient(url: string, options?: RequestInit): Promise<Response> {
    const token = getToken();

    const res = await fetchWithAuth(url, options, token);

    if (res.status === 401 && url !== "/api/auth/refresh") {
        const refreshRes = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });

        if (refreshRes.ok) {
            const { accessToken } = await refreshRes.json();
            setToken(accessToken);

            return fetchWithAuth(url, options, accessToken);
        }

        setToken(null);
        onSessionExpired?.();
        throw new Error("Session expired");
    }

    return res;
}
