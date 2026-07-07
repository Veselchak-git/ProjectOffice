/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { STATUS_CODES } from "node:http";

export const HTTP_STATUS = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    INTERNAL_SERVER_ERROR: 500
} as const;

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    public constructor(statusCode: number, message?: string, code = "APP_ERROR") {
        super(message ?? STATUS_CODES[statusCode] ?? "Application Error");

        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
    }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;
