/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { type Static, Type } from "@fastify/type-provider-typebox";

import { userRoleSchema } from "@/schemas/userDto/index.js";

export const authUserSchema = Type.Object({
    id: Type.String(),
    login: Type.String(),
    role: userRoleSchema
});

export type AuthUser = Static<typeof authUserSchema>;

export const loginBodySchema = Type.Object({
    login: Type.String(),
    password: Type.String({ minLength: 1 })
});
export type LoginRequest = Static<typeof loginBodySchema>;

export const loginResponseSchema = Type.Object({
    accessToken: Type.String(),
    expiresIn: Type.String(),
    user: authUserSchema
});
export type LoginResponse = Static<typeof loginResponseSchema>;

export const currentUserResponseSchema = Type.Object({
    user: authUserSchema
});
export type CurrentUserResponse = Static<typeof currentUserResponseSchema>;

export const postLoginSchema = {
    body: loginBodySchema,
    response: {
        200: loginResponseSchema
    }
};

export const getCurrentUserSchema = {
    response: {
        200: currentUserResponseSchema
    }
};
