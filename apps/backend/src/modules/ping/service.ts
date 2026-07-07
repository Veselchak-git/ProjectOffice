/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";

import type { PingResponseSchema, getPingSchema } from "./schema.js";

export const getPingService = async (req: FastifyRequestTypeBox<typeof getPingSchema>): Promise<PingResponseSchema> => {
    return { message: `Hello ${req.query.name}` };
};
