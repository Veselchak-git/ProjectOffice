/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import fp from "fastify-plugin";

import { cookiePlugin } from "./cookie-plugin/index.js";
import { envPlugin } from "./env-plugin/index.js";
import { jwtPlugin } from "./jwt-plugin/index.js";
import { prismaPlugin } from "./prisma-plugin/index.js";

//подключаем тут только глобальные плагины
export const appPlugins = fp(
    async fastify => {
        // региструем плагины в порядке зависимости - env первый т.к. он используется в других плагинах
        await fastify.register(envPlugin);
        await fastify.register(cookiePlugin);
        await fastify.register(jwtPlugin);
        await fastify.register(prismaPlugin);
    },
    {
        name: "app-plugins"
    }
);
