/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { type Static, Type } from "@fastify/type-provider-typebox";

import { userDtoSchema, userRoleSchema } from "@/schemas/userDto/index.js";

export const exampleProfileResponseSchema = Type.Object({
    message: Type.String(),
    user: userDtoSchema
});

export type ExampleProfileResponse = Static<typeof exampleProfileResponseSchema>;

export const exampleAdminResponseSchema = Type.Object({
    message: Type.String(),
    accessLevel: userRoleSchema
});

export type ExampleAdminResponse = Static<typeof exampleAdminResponseSchema>;

export const getExampleProfileSchema = {
    response: {
        200: exampleProfileResponseSchema
    }
};

export const getExampleAdminSchema = {
    response: {
        200: exampleAdminResponseSchema
    }
};
