import { beforeEach, describe, expect, it, vi } from "vitest";

import * as apiUtils from "@/shared/lib/api";
import { apiClient } from "@/shared/lib/auth";

import { fetchAuditLogs } from "./audit-log";

vi.mock("@/shared/lib/api", () => ({
    buildQueryString: vi.fn(),
    handleApiResponse: vi.fn()
}));

vi.mock("@/shared/lib/auth", () => ({
    apiClient: vi.fn()
}));

function mockOkResponse(data: unknown): Response {
    return { ok: true, json: () => Promise.resolve(data) } as Response;
}

describe("audit-log API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiUtils.buildQueryString).mockReturnValue("");
        vi.mocked(apiUtils.handleApiResponse).mockImplementation(async (res: Response) => res.json());
    });

    describe("fetchAuditLogs", () => {
        it("calls GET /api/audit-log and returns response", async () => {
            const response = { logs: [], total: 0, page: 1, perPage: 10 };
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse(response));

            const result = await fetchAuditLogs();

            expect(apiClient).toHaveBeenCalledWith("/api/audit-log");
            expect(result).toEqual(response);
        });

        it("appends query string from params", async () => {
            vi.mocked(apiUtils.buildQueryString).mockReturnValue("?page=2&perPage=25");
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse({ logs: [], total: 0, page: 2, perPage: 25 }));

            await fetchAuditLogs({ page: 2, perPage: 25 });

            expect(apiClient).toHaveBeenCalledWith("/api/audit-log?page=2&perPage=25");
        });

        it("appends filter param when provided", async () => {
            vi.mocked(apiUtils.buildQueryString).mockReturnValue("?filter=UPDATE");
            vi.mocked(apiClient).mockResolvedValue(mockOkResponse({ logs: [], total: 0, page: 1, perPage: 10 }));

            await fetchAuditLogs({ filter: "UPDATE" });

            expect(apiClient).toHaveBeenCalledWith("/api/audit-log?filter=UPDATE");
        });
    });
});
