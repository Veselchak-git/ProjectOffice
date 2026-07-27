/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import argon2 from "argon2";
import { hashPassword, verifyPassword } from "./index";

vi.mock("argon2", () => ({
    default: {
        hash: vi.fn(),
        verify: vi.fn(),
    },
}));

describe("hashPassword", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return a string that is a valid argon2 hash", async () => {
        const fakeHash = "$argon2id$v=19$m=65536$fake-hash";
        vi.mocked(argon2.hash).mockResolvedValue(fakeHash as never);

        const result = await hashPassword("mypassword");

        expect(result).toBe(fakeHash);
        expect(argon2.hash).toHaveBeenCalledWith("mypassword");
    });

    it("should produce different hash when saltSecret is provided", async () => {
        vi.mocked(argon2.hash).mockResolvedValue("hash-with-salt" as never);

        const withSalt = await hashPassword("password", "my-salt");

        expect(argon2.hash).toHaveBeenCalledWith("passwordmy-salt");
        expect(withSalt).toBe("hash-with-salt");
    });

    it("should concatenate password and saltSecret before hashing", async () => {
        vi.mocked(argon2.hash).mockResolvedValue("h" as never);

        await hashPassword("pass", "secret");

        expect(argon2.hash).toHaveBeenCalledWith("passsecret");
    });
});

describe("verifyPassword", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return true for correct password", async () => {
        vi.mocked(argon2.verify).mockResolvedValue(true as never);

        const result = await verifyPassword("mypassword", "$argon2hash$");

        expect(result).toBe(true);
        expect(argon2.verify).toHaveBeenCalledWith("$argon2hash$", "mypassword");
    });

    it("should return false for wrong password", async () => {
        vi.mocked(argon2.verify).mockResolvedValue(false as never);

        const result = await verifyPassword("wrongpassword", "$argon2hash$");

        expect(result).toBe(false);
        expect(argon2.verify).toHaveBeenCalledWith("$argon2hash$", "wrongpassword");
    });

    it("should work with saltSecret", async () => {
        vi.mocked(argon2.verify).mockResolvedValue(true as never);

        const result = await verifyPassword("password", "$argon2hash$", "my-salt");

        expect(result).toBe(true);
        expect(argon2.verify).toHaveBeenCalledWith("$argon2hash$", "passwordmy-salt");
    });

    it("should concatenate password and saltSecret before verifying", async () => {
        vi.mocked(argon2.verify).mockResolvedValue(true as never);

        await verifyPassword("pass", "$hash$", "secret");

        expect(argon2.verify).toHaveBeenCalledWith("$hash$", "passsecret");
    });
});
