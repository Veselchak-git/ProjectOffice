/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { PrismaClient } from "@/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { ENV_PLUGIN_NAME } from "@/plugins/env-plugin/index.js";

export const PRISMA_PLUGIN_NAME = "prismaPlugin";
export const PRISMA_DECORATOR_NAME = "prisma";

const plugin: FastifyPluginAsync = async fastify => {
    const pgAdapter = new PrismaPg({ connectionString: fastify.config.DATABASE_URL });
    const prisma = new PrismaClient({ adapter: pgAdapter });
    await prisma.$connect();

    fastify.decorate(PRISMA_DECORATOR_NAME, prisma);

    fastify.addHook("onClose", async fastify => {
        await fastify.prisma.$disconnect();
    });
};

export const prismaPlugin = fp(plugin, { name: PRISMA_PLUGIN_NAME, dependencies: [ENV_PLUGIN_NAME] });

declare module "fastify" {
    interface FastifyInstance {
        [PRISMA_DECORATOR_NAME]: PrismaClient;
    }
}
