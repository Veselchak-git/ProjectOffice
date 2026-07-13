import { getToken, setToken } from "./token-store";

export async function apiClient(url: string, options?: RequestInit): Promise<Response> {
    const token = getToken();

    const res = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
            ...options?.headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    });

    if (res.status === 401 && url !== "/api/auth/refresh") {
        const refreshRes = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });

        if (refreshRes.ok) {
            const { accessToken } = await refreshRes.json();
            setToken(accessToken);

            return fetch(url, {
                ...options,
                credentials: "include",
                headers: {
                    ...options?.headers,
                    Authorization: `Bearer ${accessToken}`
                }
            });
        }

        setToken(null);
        window.location.href = "/login";
        throw new Error("Session expired");
    }

    return res;
}
