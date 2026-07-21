/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

import { Prisma } from "@/generated/prisma/client.js";
import { AppError, HTTP_STATUS, isAppError } from "@/shared/lib/errors/index.js";

export const handlePrismaError = (error: unknown): AppError => {
    if (isAppError(error)) {
        return error;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002":
                return new AppError(HTTP_STATUS.CONFLICT, "Resource already exists", "DUPLICATE_ENTRY");
            case "P2025":
                return new AppError(HTTP_STATUS.NOT_FOUND, "Record not found", "RECORD_NOT_FOUND");
            case "P2003":
                return new AppError(HTTP_STATUS.BAD_REQUEST, "Foreign key constraint failed", "FOREIGN_KEY_ERROR");
            default:
                return new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Database error", "DATABASE_ERROR");
        }
    }
    return new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Internal server error", "INTERNAL_ERROR");
};
