/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { userRepositoryPlugin } from "@/modules/users/repository.js";

import { authControllerPlugin } from "./controller.js";

const plugin: FastifyPluginAsync = async fastify => {
    //добавляем нужные зависимости для модуля, они попадут в дерево плагинов всей ветки ниже
    await fastify.register(userRepositoryPlugin);
    //добавляем контроллеры для модуля
    await fastify.register(authControllerPlugin);
};

export const authModulePlugin = fp(plugin, {
    name: "auth-module-plugin"
});
