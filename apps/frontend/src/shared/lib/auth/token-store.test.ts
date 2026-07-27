import { BrowserStorage } from "@helpdesk-portal/ui-kit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@helpdesk-portal/ui-kit", () => ({
    BrowserStorage: {
        create: vi.fn()
    }
}));

const mockGetValue = vi.fn();
const mockSetValue = vi.fn();
const mockRemove = vi.fn();

function setupMockStorage() {
    vi.mocked(BrowserStorage.create).mockReturnValue({
        getValue: mockGetValue,
        setValue: mockSetValue,
        remove: mockRemove
    } as unknown as ReturnType<typeof BrowserStorage.create>);
}

describe("token-store", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getToken возвращает null когда storage не содержит токена", async () => {
        setupMockStorage();
        mockGetValue.mockReturnValue(null);

        const { getToken } = await import("./token-store");

        expect(getToken()).toBeNull();
    });

    it("getToken возвращает токен из storage при инициализации", async () => {
        setupMockStorage();
        mockGetValue.mockReturnValue("initial-token");

        const { getToken } = await import("./token-store");

        expect(getToken()).toBe("initial-token");
    });

    it("setToken сохраняет токен и записывает в storage", async () => {
        setupMockStorage();
        mockGetValue.mockReturnValue(null);

        const { getToken, setToken } = await import("./token-store");

        setToken("new-token");

        expect(getToken()).toBe("new-token");
        expect(mockSetValue).toHaveBeenCalledWith("accessToken", "new-token");
    });

    it("setToken(null) очищает токен и удаляет из storage", async () => {
        setupMockStorage();
        mockGetValue.mockReturnValue("old-token");

        const { getToken, setToken } = await import("./token-store");

        setToken(null);

        expect(getToken()).toBeNull();
        expect(mockRemove).toHaveBeenCalledWith("accessToken");
    });
});
