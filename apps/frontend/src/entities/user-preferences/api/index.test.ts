import { beforeEach, describe, expect, it, vi } from "vitest";

import * as apiUtils from "@/shared/lib/api";
import { apiClient } from "@/shared/lib/auth";

import { fetchUserPreference, saveUserPreference } from "./index";

vi.mock("@/shared/lib/api", () => ({
    handleApiResponse: vi.fn()
}));

vi.mock("@/shared/lib/auth", () => ({
    apiClient: vi.fn()
}));

function mockResponse(options: { ok?: boolean; json?: () => Promise<unknown> }): Response {
    return {
        ok: options.ok ?? true,
        json: options.json ?? (() => Promise.resolve({}))
    } as Response;
}

describe("user-preferences API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("fetchUserPreference", () => {
        it("calls GET /api/users/me/preferences with encoded page param", async () => {
            vi.mocked(apiClient).mockResolvedValue(
                mockResponse({ json: () => Promise.resolve({ settings: { foo: "bar" } }) })
            );

            const result = await fetchUserPreference("issues");

            expect(apiClient).toHaveBeenCalledWith("/api/users/me/preferences?page=issues");
            expect(result).toEqual({ foo: "bar" });
        });

        it("returns null when response is not ok", async () => {
            vi.mocked(apiClient).mockResolvedValue(mockResponse({ ok: false }));

            const result = await fetchUserPreference("projects");

            expect(result).toBeNull();
        });

        it("returns null when settings is absent in response", async () => {
            vi.mocked(apiClient).mockResolvedValue(mockResponse({ json: () => Promise.resolve({}) }));

            const result = await fetchUserPreference("issues");

            expect(result).toBeNull();
        });

        it("returns null when settings is null", async () => {
            vi.mocked(apiClient).mockResolvedValue(mockResponse({ json: () => Promise.resolve({ settings: null }) }));

            const result = await fetchUserPreference("issues");

            expect(result).toBeNull();
        });

        it("encodes special characters in page param", async () => {
            vi.mocked(apiClient).mockResolvedValue(mockResponse({ json: () => Promise.resolve({ settings: {} }) }));

            await fetchUserPreference("page/with/slashes");

            expect(apiClient).toHaveBeenCalledWith("/api/users/me/preferences?page=page%2Fwith%2Fslashes");
        });
    });

    describe("saveUserPreference", () => {
        it("calls PUT /api/users/me/preferences with page and settings", async () => {
            vi.mocked(apiUtils.handleApiResponse).mockResolvedValue(undefined);

            await saveUserPreference("issues", { columnVisibility: { name: true } });

            expect(apiClient).toHaveBeenCalledWith("/api/users/me/preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ page: "issues", settings: { columnVisibility: { name: true } } })
            });
        });

        it("delegates to handleApiResponse for error handling", async () => {
            vi.mocked(apiUtils.handleApiResponse).mockResolvedValue(undefined);

            await saveUserPreference("projects", {});

            expect(apiUtils.handleApiResponse).toHaveBeenCalled();
        });
    });
});
