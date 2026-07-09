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
    password: Type.String({ minLength: 6 })
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

export const refreshResponseSchema = Type.Object({
    accessToken: Type.String(),
    expiresIn: Type.String()
});
export type RefreshResponse = Static<typeof refreshResponseSchema>;

export const refreshSchema = {
    response: {
        200: refreshResponseSchema
    }
};

export const logoutResponseSchema = Type.Object({
    message: Type.String()
});
export type LogoutResponse = Static<typeof logoutResponseSchema>;

export const logoutSchema = {
    response: {
        200: logoutResponseSchema
    }
};

export const changePasswordBodySchema = Type.Object({
    currentPassword: Type.String({ minLength: 1 }),
    newPassword: Type.String({ minLength: 6 })
});
export type ChangePasswordRequest = Static<typeof changePasswordBodySchema>;

export const changePasswordSchema = {
    body: changePasswordBodySchema,
    response: {
        200: Type.Object({
            message: Type.String()
        })
    }
};
