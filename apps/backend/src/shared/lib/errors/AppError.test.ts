/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { describe, expect, it } from "vitest";

import { AppError, HTTP_STATUS, isAppError } from "./AppError.js";

describe("HTTP_STATUS", () => {
    it("contains correct values", () => {
        expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
        expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
        expect(HTTP_STATUS.FORBIDDEN).toBe(403);
        expect(HTTP_STATUS.NOT_FOUND).toBe(404);
        expect(HTTP_STATUS.CONFLICT).toBe(409);
        expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    });
});

describe("AppError", () => {
    it("sets statusCode, message, code, and name correctly", () => {
        const error = new AppError(404, "Not found", "CUSTOM_CODE");

        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(Error);
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe("Not found");
        expect(error.code).toBe("CUSTOM_CODE");
        expect(error.name).toBe("AppError");
    });

    it("uses default code 'APP_ERROR' when code is not provided", () => {
        const error = new AppError(400, "Bad request");

        expect(error.code).toBe("APP_ERROR");
    });

    it("uses default message from STATUS_CODES when message is not provided", () => {
        const error = new AppError(401);

        expect(error.message).toBe("Unauthorized");
    });

    it("falls back to 'Application Error' for unknown status code without message", () => {
        const error = new AppError(999);

        expect(error.message).toBe("Application Error");
    });

    it("preserves stack trace", () => {
        const error = new AppError(500, "Internal error");

        expect(error.stack).toBeDefined();
        expect(error.stack).toContain("AppError");
    });
});

describe("isAppError", () => {
    it("returns true for AppError instance", () => {
        const error = new AppError(400, "Bad request");

        expect(isAppError(error)).toBe(true);
    });

    it("returns false for regular Error", () => {
        const error = new Error("regular error");

        expect(isAppError(error)).toBe(false);
    });

    it("returns false for non-error values", () => {
        expect(isAppError(null)).toBe(false);
        expect(isAppError(undefined)).toBe(false);
        expect(isAppError("string")).toBe(false);
        expect(isAppError(42)).toBe(false);
        expect(isAppError({})).toBe(false);
    });
});
