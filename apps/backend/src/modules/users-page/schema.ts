import { Role } from "@/generated/prisma/client.js";
import { type Static, Type } from "@fastify/type-provider-typebox";

export const userResponseSchema = Type.Object({
    id: Type.Number(),
    login: Type.String(),
    role: Type.Enum(Role),
    createdAt: Type.String(),
});

export type UserResponse = Static<typeof userResponseSchema>;

export const getUsersSchema = {
    response: {
        200: Type.Array(userResponseSchema),
    },
};

export const createUserBodySchema = Type.Object({
    login: Type.String({ minLength: 1 }),
    password: Type.String({ minLength: 6 }),
    role: Type.Enum(Role),
});

export type CreateUserBody = Static<typeof createUserBodySchema>;

export const createUserSchema = {
    body: createUserBodySchema,
    response: {
        201: userResponseSchema,
    },
};

export const deleteUserSchema = {
    params: Type.Object({
        id: Type.Number(),
    }),
    response: {
        204: Type.Null(),
    },
};

export const updateUserRoleBodySchema = Type.Object({
    role: Type.Enum(Role),
});

export type UpdateUserRoleBody = Static<typeof updateUserRoleBodySchema>;

export const updateUserRoleSchema = {
    params: Type.Object({
        id: Type.Number(),
    }),
    body: updateUserRoleBodySchema,
    response: {
        200: userResponseSchema,
    },
};
