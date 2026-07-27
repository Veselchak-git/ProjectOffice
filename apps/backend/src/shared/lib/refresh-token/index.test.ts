import { generateRefreshToken, hashRefreshToken } from "./index";

describe("generateRefreshToken", () => {
    it("returns a string in UUID format", () => {
        const token = generateRefreshToken();

        expect(typeof token).toBe("string");
        expect(token).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );
    });

    it("returns unique values on multiple calls", () => {
        const tokens = Array.from({ length: 10 }, () => generateRefreshToken());

        const unique = new Set(tokens);
        expect(unique.size).toBe(10);
    });
});

describe("hashRefreshToken", () => {
    it("returns a 64-char hex string (SHA-256)", () => {
        const hash = hashRefreshToken("test-token");

        expect(typeof hash).toBe("string");
        expect(hash).toHaveLength(64);
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("produces deterministic output for same input", () => {
        const input = "same-input-value";

        const hash1 = hashRefreshToken(input);
        const hash2 = hashRefreshToken(input);

        expect(hash1).toBe(hash2);
    });

    it("produces different output for different inputs", () => {
        const hash1 = hashRefreshToken("token-a");
        const hash2 = hashRefreshToken("token-b");

        expect(hash1).not.toBe(hash2);
    });
});
