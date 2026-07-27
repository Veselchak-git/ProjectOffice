/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import Ajv from "ajv";

import { envSchema } from "./schema.js";

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(envSchema);

describe("envSchema", () => {
    it("validates correct config with all required fields", () => {
        const config = {
            NODE_ENV: "production",
            PORT: 3000,
            HOST: "127.0.0.1",
            DATABASE_URL: "postgresql://user:pass@host:5432/db",
            JWT_ACCESS_SECRET: "access-secret",
            JWT_ACCESS_TTL: "15m",
            REFRESH_TOKEN_SECRET: "refresh-secret",
            REFRESH_TOKEN_TTL: "7d",
            SALT_SECRET: "salt-secret"
        };

        expect(validate(config)).toBe(true);
    });

    it("applies default values for all fields", () => {
        const jsonSchema = JSON.parse(JSON.stringify(envSchema)) as Record<string, unknown>;
        const props = jsonSchema.properties as Record<string, { default: unknown }>;

        expect(props.NODE_ENV.default).toBe("development");
        expect(props.PORT.default).toBe(8442);
        expect(props.HOST.default).toBe("0.0.0.0");
        expect(props.DATABASE_URL.default).toBe("postgresql://postgres:postgres@localhost:5432/helpdesk_portal");
        expect(props.JWT_ACCESS_SECRET.default).toBe("dev-access-secret-change-me");
        expect(props.JWT_ACCESS_TTL.default).toBe("15m");
        expect(props.REFRESH_TOKEN_SECRET.default).toBe("dev-refresh-secret-change-me");
        expect(props.REFRESH_TOKEN_TTL.default).toBe("7d");
        expect(props.SALT_SECRET.default).toBe("dev-salt-secret-change-me");
    });

    it("rejects empty object", () => {
        expect(validate({})).toBe(false);
    });

    it("rejects config with only some fields", () => {
        const config = {
            NODE_ENV: "development",
            PORT: 8442
        };

        expect(validate(config)).toBe(false);
    });

    it("validates PORT as a number", () => {
        const config = {
            NODE_ENV: "development",
            PORT: 8442,
            HOST: "0.0.0.0",
            DATABASE_URL: "postgresql://localhost/db",
            JWT_ACCESS_SECRET: "secret",
            JWT_ACCESS_TTL: "15m",
            REFRESH_TOKEN_SECRET: "secret",
            REFRESH_TOKEN_TTL: "7d",
            SALT_SECRET: "salt"
        };

        expect(validate(config)).toBe(true);
    });

    it("rejects PORT as a string", () => {
        const config = {
            NODE_ENV: "development",
            PORT: "8442",
            HOST: "0.0.0.0",
            DATABASE_URL: "postgresql://localhost/db",
            JWT_ACCESS_SECRET: "secret",
            JWT_ACCESS_TTL: "15m",
            REFRESH_TOKEN_SECRET: "secret",
            REFRESH_TOKEN_TTL: "7d",
            SALT_SECRET: "salt"
        };

        expect(validate(config)).toBe(false);
    });

    it("validates DATABASE_URL as a string", () => {
        const config = {
            NODE_ENV: "development",
            PORT: 8442,
            HOST: "0.0.0.0",
            DATABASE_URL: "postgresql://user:password@host:5432/database?sslmode=require",
            JWT_ACCESS_SECRET: "secret",
            JWT_ACCESS_TTL: "15m",
            REFRESH_TOKEN_SECRET: "secret",
            REFRESH_TOKEN_TTL: "7d",
            SALT_SECRET: "salt"
        };

        expect(validate(config)).toBe(true);
    });

    it("rejects DATABASE_URL as a number", () => {
        const config = {
            NODE_ENV: "development",
            PORT: 8442,
            HOST: "0.0.0.0",
            DATABASE_URL: 12345,
            JWT_ACCESS_SECRET: "secret",
            JWT_ACCESS_TTL: "15m",
            REFRESH_TOKEN_SECRET: "secret",
            REFRESH_TOKEN_TTL: "7d",
            SALT_SECRET: "salt"
        };

        expect(validate(config)).toBe(false);
    });

    it("rejects NODE_ENV as a number", () => {
        const config = {
            NODE_ENV: 42,
            PORT: 8442,
            HOST: "0.0.0.0",
            DATABASE_URL: "postgresql://localhost/db",
            JWT_ACCESS_SECRET: "secret",
            JWT_ACCESS_TTL: "15m",
            REFRESH_TOKEN_SECRET: "secret",
            REFRESH_TOKEN_TTL: "7d",
            SALT_SECRET: "salt"
        };

        expect(validate(config)).toBe(false);
    });

    it("accepts minimal dev config", () => {
        const config = {
            NODE_ENV: "development",
            PORT: 8442,
            HOST: "0.0.0.0",
            DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/helpdesk_portal",
            JWT_ACCESS_SECRET: "dev-access-secret-change-me",
            JWT_ACCESS_TTL: "15m",
            REFRESH_TOKEN_SECRET: "dev-refresh-secret-change-me",
            REFRESH_TOKEN_TTL: "7d",
            SALT_SECRET: "dev-salt-secret-change-me"
        };

        expect(validate(config)).toBe(true);
    });

    it("accepts production config", () => {
        const config = {
            NODE_ENV: "production",
            PORT: 443,
            HOST: "0.0.0.0",
            DATABASE_URL: "postgresql://prod_user:strong_password@prod-host:5432/prod_db",
            JWT_ACCESS_SECRET: "prod-access-secret-very-long",
            JWT_ACCESS_TTL: "10m",
            REFRESH_TOKEN_SECRET: "prod-refresh-secret-very-long",
            REFRESH_TOKEN_TTL: "30d",
            SALT_SECRET: "prod-salt-secret-very-long"
        };

        expect(validate(config)).toBe(true);
    });

    it("schema defines 9 properties", () => {
        const jsonSchema = JSON.parse(JSON.stringify(envSchema)) as Record<string, unknown>;
        const props = jsonSchema.properties as Record<string, unknown>;

        expect(Object.keys(props)).toHaveLength(9);
    });

    it("schema has type object at root", () => {
        const jsonSchema = JSON.parse(JSON.stringify(envSchema)) as Record<string, unknown>;

        expect(jsonSchema.type).toBe("object");
    });
});
