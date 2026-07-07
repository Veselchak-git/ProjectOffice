/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fp from "fastify-plugin";

import { PING_PATH } from "@/shared/routes.js";

import { getPingSchema } from "./schema.js";
import { getPingService } from "./service.js";

const plugin: FastifyPluginAsyncTypebox = async fastify => {
    fastify.get(
        PING_PATH,
        {
            schema: getPingSchema
        },
        getPingService
    );
};

export const pingControllerPlugin = fp(plugin, {
    name: "ping-controller"
});
