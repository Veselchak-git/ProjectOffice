/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx src/shared/lib/db-seed/seed.ts"
    },
    datasource: {
        url: process.env["DATABASE_URL"] ?? "postgresql://postgres:postgres@localhost:5432/helpdesk_portal"
    }
});
