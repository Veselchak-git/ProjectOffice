/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { PrismaClient } from "@/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { hashPassword } from "../hash-password/index.js";

const connectionString = `${process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/helpdesk_portal"}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const user1 = await prisma.user.upsert({
        where: { login: "user@example.com" },
        update: {},
        create: {
            login: "user@example.com",
            hashPassword: await hashPassword("Test123456", process.env.SALT_SECRET ?? ""),
            role: "USER"
        }
    });
    const user2 = await prisma.user.upsert({
        where: { login: "manager@example.com" },
        update: {},
        create: {
            login: "manager@example.com",
            hashPassword: await hashPassword("Test123456", process.env.SALT_SECRET ?? ""),
            role: "USER"
        }
    });
    const user3 = await prisma.user.upsert({
        where: { login: "admin@example.com" },
        update: {},
        create: {
            login: "admin@example.com",
            hashPassword: await hashPassword("Test123456", process.env.SALT_SECRET ?? ""),
            role: "ADMIN"
        }
    });
    console.log({ user1, user2, user3 });
}
main()
    .then(async () => {
        await prisma.$disconnect();
        await pool.end();
    })
    .catch(async e => {
        console.error(e);
        await prisma.$disconnect();
        await pool.end();
        process.exit(1);
    });
