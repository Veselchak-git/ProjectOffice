import { Prisma } from "@/generated/prisma/client.js";
import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";

import { handlePrismaError } from "./index.js";

const makePrismaError = (code: string, message = "Test error") =>
    new Prisma.PrismaClientKnownRequestError(message, { code, clientVersion: "7.8.0" });

describe("handlePrismaError", () => {
    it("returns AppError with CONFLICT for P2002 (unique constraint)", () => {
        const error = handlePrismaError(makePrismaError("P2002"));
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(HTTP_STATUS.CONFLICT);
        expect(error.code).toBe("DUPLICATE_ENTRY");
    });

    it("returns AppError with NOT_FOUND for P2025 (record not found)", () => {
        const error = handlePrismaError(makePrismaError("P2025"));
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
        expect(error.code).toBe("RECORD_NOT_FOUND");
    });

    it("returns AppError with BAD_REQUEST for P2003 (foreign key constraint)", () => {
        const error = handlePrismaError(makePrismaError("P2003"));
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(error.code).toBe("FOREIGN_KEY_ERROR");
    });

    it("returns AppError with INTERNAL_SERVER_ERROR for unknown Prisma code", () => {
        const error = handlePrismaError(makePrismaError("P9999"));
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(error.code).toBe("DATABASE_ERROR");
    });

    it("returns AppError with INTERNAL_SERVER_ERROR for non-Prisma errors", () => {
        const error = handlePrismaError(new Error("Something unexpected"));
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(error.code).toBe("INTERNAL_ERROR");
    });

    it("returns AppError with INTERNAL_SERVER_ERROR for unknown throw values", () => {
        const error = handlePrismaError("string error");
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(error.code).toBe("INTERNAL_ERROR");
    });

    it("returns existing AppError without wrapping", () => {
        const originalError = new AppError(HTTP_STATUS.FORBIDDEN, "Access denied", "AUTH_FORBIDDEN");
        const result = handlePrismaError(originalError);
        expect(result).toBe(originalError);
        expect(result.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
        expect(result.code).toBe("AUTH_FORBIDDEN");
    });

    it("caller can throw the returned AppError", () => {
        const throwHandler = (): void => {
            throw handlePrismaError(makePrismaError("P2002"));
        };
        expect(throwHandler).toThrow(AppError);
    });
});
