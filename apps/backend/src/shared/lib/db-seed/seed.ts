/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { PrismaClient } from "@/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
// import "dotenv/config";
import { Pool } from "pg";

import { hashPassword } from "../hash-password/index.js";

const connectionString = `${process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/helpdesk_portal"}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const user1 = await prisma.user.upsert({
        where: { login: "test-user-1" },
        update: {},
        create: {
            login: "test-user-1",
            hashPassword: await hashPassword("Test123456", process.env.SALT_SECRET ?? ""),
            role: "GUEST"
        }
    });
    const user2 = await prisma.user.upsert({
        where: { login: "test-user-2" },
        update: {},
        create: {
            login: "test-user-2",
            hashPassword: await hashPassword("Test123456", process.env.SALT_SECRET ?? ""),
            role: "GUEST"
        }
    });
    const user3 = await prisma.user.upsert({
        where: { login: "test-user-3" },
        update: {},
        create: {
            login: "test-user-3",
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
