/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Role } from "@/generated/prisma/client.js";

import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";

import type { ExampleAdminResponse, ExampleProfileResponse, getExampleProfileSchema } from "./schema.js";

export const getExampleProfileService = async (
    request: FastifyRequestTypeBox<typeof getExampleProfileSchema>
): Promise<ExampleProfileResponse> => {
    return {
        message: "Route is available for any authenticated user",
        user: {
            id: Number(request.user.sub),
            login: request.user.login,
            role: request.user.role
        }
    };
};

export const getExampleAdminService = async (): Promise<ExampleAdminResponse> => {
    return {
        message: "Route is available only for admin users",
        accessLevel: Role.ADMIN
    };
};
