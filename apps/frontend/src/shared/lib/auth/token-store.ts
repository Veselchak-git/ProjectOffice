const STORAGE_KEY = "accessToken";

let accessToken: string | null = (() => {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
})();

export function setToken(token: string | null) {
    accessToken = token;
    try {
        if (token) {
            localStorage.setItem(STORAGE_KEY, token);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        /* ignore */
    }
}

export function getToken(): string | null {
    return accessToken;
}
