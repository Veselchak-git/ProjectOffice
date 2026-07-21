/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient, setOnSessionExpired } from "./api-client";
import { getToken } from "./token-store";

vi.mock("./token-store", () => ({
    getToken: vi.fn(() => "test-token"),
    setToken: vi.fn()
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(options: { ok?: boolean; status?: number; json?: () => Promise<unknown> }): Response {
    return {
        ok: options.ok ?? true,
        status: options.status ?? 200,
        json: options.json ?? (() => Promise.resolve({}))
    } as Response;
}

describe("apiClient", () => {
    const onSessionExpired = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getToken).mockReturnValue("test-token");
        setOnSessionExpired(onSessionExpired);
    });

    afterEach(() => {
        setOnSessionExpired(null);
    });

    it("performs fetch with auth headers and returns response", async () => {
        const response = mockResponse({ ok: true, status: 200 });
        mockFetch.mockResolvedValueOnce(response);

        const result = await apiClient("/api/test", { method: "GET" });

        expect(result).toBe(response);
        expect(mockFetch).toHaveBeenCalledWith("/api/test", {
            method: "GET",
            credentials: "include",
            headers: { Authorization: "Bearer test-token" }
        });
    });

    it("throws network error when TypeError: Failed to fetch occurs", async () => {
        const networkError = new TypeError("Failed to fetch");
        mockFetch.mockRejectedValueOnce(networkError);

        try {
            await apiClient("/api/test");
            expect.fail("should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe("Network error. Please check your connection.");
            expect((error as Error).cause).toBe(networkError);
        }
    });

    it("throws network error when refresh endpoint fails with TypeError", async () => {
        const unauthorizedResponse = mockResponse({ ok: false, status: 401 });
        mockFetch.mockResolvedValueOnce(unauthorizedResponse);
        const networkError = new TypeError("Failed to fetch");
        mockFetch.mockRejectedValueOnce(networkError);

        try {
            await apiClient("/api/test");
            expect.fail("should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe("Network error. Please check your connection.");
            expect((error as Error).cause).toBe(networkError);
        }
        expect(onSessionExpired).not.toHaveBeenCalled();
    });

    it("re-throws non-network errors", async () => {
        const customError = new Error("Some other error");
        mockFetch.mockRejectedValueOnce(customError);

        await expect(apiClient("/api/test")).rejects.toThrow("Some other error");
    });
});
