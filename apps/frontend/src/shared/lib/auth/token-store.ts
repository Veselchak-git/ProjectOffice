import { BrowserStorage } from "@helpdesk-portal/ui-kit";

const STORAGE_KEY = "accessToken";

const storage = BrowserStorage.create();

let accessToken: string | null = storage?.getValue(STORAGE_KEY) ?? null;

export function setToken(token: string | null) {
    accessToken = token;
    if (token) {
        storage?.setValue(STORAGE_KEY, token);
    } else {
        storage?.remove(STORAGE_KEY);
    }
}

export function getToken(): string | null {
    return accessToken;
}
