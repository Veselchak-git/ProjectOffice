import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAppSelector } from "@/shared/lib/redux";

import { apiClient } from "./api-client";
import { setToken } from "./token-store";
import { initAuth, useAuth } from "./use-auth";

const mockDispatch = vi.fn();

vi.mock("@/shared/lib/redux", () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn((selector: (state: unknown) => unknown) => selector({ auth: { user: null, loading: true } }))
}));

vi.mock("./token-store", () => ({
    setToken: vi.fn()
}));

vi.mock("./api-client", () => ({
    apiClient: vi.fn()
}));

const mockApiClient = vi.mocked(apiClient);
const mockSetToken = vi.mocked(setToken);

function mockResponse(ok: boolean, body: unknown = {}): Response {
    return {
        ok,
        status: ok ? 200 : 401,
        json: () => Promise.resolve(body)
    } as Response;
}

describe("useAuth", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDispatch.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("возвращает user и loading из redux", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useAppSelector as any).mockImplementation(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (selector: (state: any) => any) =>
                selector({ auth: { user: { id: "1", login: "admin", role: "ADMIN" }, loading: false } })
        );

        const { result } = renderHook(() => useAuth());

        expect(result.current.user).toEqual({ id: "1", login: "admin", role: "ADMIN" });
        expect(result.current.loading).toBe(false);
    });

    it("login вызывает apiClient, сохраняет токен и диспатчит loginSuccess", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useAppSelector as any).mockImplementation(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (selector: (state: any) => any) => selector({ auth: { user: null, loading: true } })
        );
        mockApiClient.mockResolvedValueOnce(
            mockResponse(true, { accessToken: "tok", user: { id: "1", login: "admin", role: "ADMIN" } })
        );

        const { result } = renderHook(() => useAuth());

        await result.current.login("admin", "password");

        expect(mockApiClient).toHaveBeenCalledWith("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login: "admin", password: "password" })
        });
        expect(mockSetToken).toHaveBeenCalledWith("tok");
        expect(mockDispatch).toHaveBeenCalled();
    });

    it("login выбрасывает ошибку при ответе сервера с ошибкой", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useAppSelector as any).mockImplementation(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (selector: (state: any) => any) => selector({ auth: { user: null, loading: true } })
        );
        mockApiClient.mockResolvedValueOnce(mockResponse(false));

        const { result } = renderHook(() => useAuth());

        await expect(result.current.login("admin", "wrong")).rejects.toThrow();
    });

    it("logout вызывает apiClient, очищает токен и диспатчит logoutAction", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useAppSelector as any).mockImplementation(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (selector: (state: any) => any) =>
                selector({ auth: { user: { id: "1", login: "admin", role: "ADMIN" }, loading: false } })
        );
        mockApiClient.mockResolvedValueOnce(mockResponse(true));

        const { result } = renderHook(() => useAuth());

        await result.current.logout();

        expect(mockSetToken).toHaveBeenCalledWith(null);
        expect(mockDispatch).toHaveBeenCalled();
    });

    it("logout не падает при ошибке API", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useAppSelector as any).mockImplementation(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (selector: (state: any) => any) => selector({ auth: { user: null, loading: false } })
        );
        mockApiClient.mockRejectedValueOnce(new Error("Network error"));

        const { result } = renderHook(() => useAuth());

        await result.current.logout();

        expect(mockSetToken).toHaveBeenCalledWith(null);
        expect(mockDispatch).toHaveBeenCalled();
    });
});

describe("initAuth", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDispatch.mockReset();
    });

    it("загружает пользователя при успешном ответе", async () => {
        mockApiClient.mockResolvedValueOnce(mockResponse(true, { user: { id: "1", login: "admin", role: "ADMIN" } }));

        await initAuth(mockDispatch);

        expect(mockApiClient).toHaveBeenCalledWith("/api/auth/me");
        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({ payload: { id: "1", login: "admin", role: "ADMIN" } })
        );
    });

    it("вызывает setLoading(false) при успешном ответе", async () => {
        mockApiClient.mockResolvedValueOnce(mockResponse(true, { user: { id: "1", login: "admin", role: "ADMIN" } }));

        await initAuth(mockDispatch);

        const lastCall = mockDispatch.mock.calls[mockDispatch.mock.calls.length - 1]![0];
        expect(lastCall.type).toBe("auth/setLoading");
        expect(lastCall.payload).toBe(false);
    });

    it("вызывает setLoading(false) при ошибке сети", async () => {
        mockApiClient.mockRejectedValueOnce(new Error("Network error"));

        await initAuth(mockDispatch);

        const lastCall = mockDispatch.mock.calls[mockDispatch.mock.calls.length - 1]![0];
        expect(lastCall.type).toBe("auth/setLoading");
        expect(lastCall.payload).toBe(false);
    });

    it("не вызывает setUser при ответе с ошибкой", async () => {
        mockApiClient.mockResolvedValueOnce(mockResponse(false));

        await initAuth(mockDispatch);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const calls = mockDispatch.mock.calls.map((c: any) => c[0].type);
        expect(calls).not.toContain("auth/setUser");
    });
});
