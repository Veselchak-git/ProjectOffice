import { beforeEach, describe, expect, it, vi } from "vitest";

import { i18n } from "@/shared/lib/i18n";

import { handleApiResponse } from "./api-utils";

vi.mock("@/shared/lib/i18n", () => ({
    i18n: {
        t: vi.fn((key: string) => key)
    }
}));

function mockResponse(options: { ok?: boolean; status?: number; json?: () => Promise<unknown> }): Response {
    return {
        ok: options.ok ?? true,
        status: options.status ?? 200,
        json: options.json ?? (() => Promise.resolve({}))
    } as Response;
}

describe("handleApiResponse", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (i18n.t as unknown as ReturnType<typeof vi.fn>).mockImplementation((key: string) => key);
    });

    it("returns parsed JSON on success", async () => {
        const data = { id: 1, name: "test" };
        const res = mockResponse({ ok: true, json: () => Promise.resolve(data) });
        const result = await handleApiResponse<typeof data>(res, "common", "error.loading");
        expect(result).toEqual(data);
    });

    it("throws Error with localized message when code matches translation", async () => {
        (i18n.t as unknown as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
            if (key === "issues:error.AUTH_FORBIDDEN") return "Недостаточно прав для этого действия";
            return key;
        });
        const res = mockResponse({
            ok: false,
            status: 403,
            json: () => Promise.resolve({ code: "AUTH_FORBIDDEN", message: "Forbidden" })
        });
        await expect(handleApiResponse(res, "issues", "error.loading")).rejects.toThrow(
            "Недостаточно прав для этого действия"
        );
    });

    it("resolves localized message from code alone when body has no message", async () => {
        (i18n.t as unknown as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
            if (key === "issues:error.ISSUE_NOT_FOUND") return "Задача не найдена";
            return key;
        });
        const res = mockResponse({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ code: "ISSUE_NOT_FOUND" })
        });
        await expect(handleApiResponse(res, "issues", "error.loading")).rejects.toThrow("Задача не найдена");
    });

    it("attaches code property to error when body has code but no message", async () => {
        const res = mockResponse({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ code: "ISSUE_NOT_FOUND" })
        });
        try {
            await handleApiResponse(res, "issues", "error.loading");
            expect.fail("should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error & { code: string }).code).toBe("ISSUE_NOT_FOUND");
        }
    });

    it("throws Error with fallbackKey translation when code has no translation", async () => {
        (i18n.t as unknown as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
            if (key === "issues:error.loading") return "Ошибка загрузки задач";
            return key;
        });
        const res = mockResponse({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ code: "UNKNOWN_CODE", message: "Server error" })
        });
        await expect(handleApiResponse(res, "issues", "error.loading")).rejects.toThrow("Ошибка загрузки задач");
    });

    it("throws Error with 'Error' when no translation found and no code", async () => {
        const res = mockResponse({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ message: "Server error" })
        });
        await expect(handleApiResponse(res, "issues", "error.loading")).rejects.toThrow("Error");
    });

    it('throws Error with "Error" when body parsing fails and no translation', async () => {
        const res = mockResponse({
            ok: false,
            status: 500,
            json: () => Promise.reject(new Error("parse error"))
        });
        await expect(handleApiResponse(res, "issues", "error.loading")).rejects.toThrow("Error");
    });

    it("attaches code property to error when present in body", async () => {
        const res = mockResponse({
            ok: false,
            status: 403,
            json: () => Promise.resolve({ code: "AUTH_FORBIDDEN", message: "Forbidden" })
        });
        try {
            await handleApiResponse(res, "issues", "error.loading");
            expect.fail("should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error & { code: string }).code).toBe("AUTH_FORBIDDEN");
        }
    });

    it("does not attach code when body has no code", async () => {
        const res = mockResponse({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ message: "Server error" })
        });
        try {
            await handleApiResponse(res, "issues", "error.loading");
            expect.fail("should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect("code" in (error as Error)).toBe(false);
        }
    });
});
