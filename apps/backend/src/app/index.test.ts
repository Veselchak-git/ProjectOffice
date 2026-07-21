/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { STATUS_CODES } from "node:http";

import Fastify, { type FastifyInstance } from "fastify";
import { describe, it, expect, beforeEach } from "vitest";

import { AppError, HTTP_STATUS, isAppError } from "@/shared/lib/errors/index.js";

const hasStatusCode = (error: unknown): error is { statusCode: number } =>
    !isAppError(error) &&
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number";

function createTestApp(): FastifyInstance {
    const fastify = Fastify({ logger: false });

    fastify.setErrorHandler((error, _request, reply) => {
        const statusCode =
            isAppError(error) || hasStatusCode(error)
                ? error.statusCode
                : HTTP_STATUS.INTERNAL_SERVER_ERROR;

        void reply.status(statusCode).send({
            statusCode,
            code: isAppError(error) ? error.code : "INTERNAL_SERVER_ERROR",
            message: isAppError(error) ? error.message : "INTERNAL_SERVER_ERROR",
            error: STATUS_CODES[statusCode] ?? "Error"
        });
    });

    fastify.get("/throw-app-error", () => {
        throw new AppError(HTTP_STATUS.NOT_FOUND, "Resource not found", "NOT_FOUND");
    });

    fastify.get("/throw-validation-error", () => {
        const error = new Error("Validation failed") as Error & { statusCode: number };
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
    });

    fastify.get("/throw-jwt-error", () => {
        const error = new Error("Token expired") as Error & { statusCode: number };
        error.statusCode = HTTP_STATUS.UNAUTHORIZED;
        throw error;
    });

    fastify.get("/throw-generic-error", () => {
        throw new Error("Something went wrong");
    });

    return fastify;
}

describe("error handler", () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        app = createTestApp();
        await app.ready();
    });

    it("returns AppError statusCode with correct code and message", async () => {
        const response = await app.inject({ method: "GET", url: "/throw-app-error" });

        expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
        expect(response.json()).toEqual({
            statusCode: HTTP_STATUS.NOT_FOUND,
            code: "NOT_FOUND",
            message: "Resource not found",
            error: "Not Found"
        });
    });

    it("returns 400 for Fastify-native validation error", async () => {
        const response = await app.inject({ method: "GET", url: "/throw-validation-error" });

        expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
        const body = response.json();
        expect(body.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(body.error).toBe("Bad Request");
    });

    it("returns 401 for JWT error", async () => {
        const response = await app.inject({ method: "GET", url: "/throw-jwt-error" });

        expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
        const body = response.json();
        expect(body.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
        expect(body.error).toBe("Unauthorized");
    });

    it("returns 500 for generic Error without statusCode", async () => {
        const response = await app.inject({ method: "GET", url: "/throw-generic-error" });

        expect(response.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(response.json()).toEqual({
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            code: "INTERNAL_SERVER_ERROR",
            message: "INTERNAL_SERVER_ERROR",
            error: "Internal Server Error"
        });
    });
});
