/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { userDtoSchema } from "./userDto/index.js";

const plugin: FastifyPluginAsyncTypebox = async fastify => {
    // регистрируем схемы глобально, если они используются в большим количестве мест во всей системе
    fastify.addSchema(userDtoSchema);
};

export const schemasPlugin = fp(plugin, { name: "schemas-plugin" });
