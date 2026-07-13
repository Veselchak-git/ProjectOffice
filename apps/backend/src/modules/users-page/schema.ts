import { Role } from "@/generated/prisma/client.js";
import { type Static, Type } from "@fastify/type-provider-typebox";

export const userResponseSchema = Type.Object({
    id: Type.Number(),
    login: Type.String(),
    role: Type.Enum(Role),
    createdAt: Type.String(),
});

export type UserResponse = Static<typeof userResponseSchema>;

export const getUsersQuerySchema = Type.Object({
    q: Type.Optional(Type.String()),
    page: Type.Optional(Type.Number({ default: 1 })),
    perPage: Type.Optional(Type.Number({ default: 20 })),
    sortBy: Type.Optional(Type.String({ default: "id" })),
    sortOrder: Type.Optional(Type.String({ default: "asc" })),
});

export type GetUsersQuery = Static<typeof getUsersQuerySchema>;

export const getUsersResponseSchema = Type.Object({
    users: Type.Array(userResponseSchema),
    total: Type.Number(),
    page: Type.Number(),
    perPage: Type.Number(),
});

export type GetUsersResponse = Static<typeof getUsersResponseSchema>;

export const getUsersSchema = {
    querystring: getUsersQuerySchema,
    response: {
        200: getUsersResponseSchema,
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

export const updateUserBodySchema = Type.Object({
    login: Type.Optional(Type.String({ minLength: 1 })),
    password: Type.Optional(Type.String({ minLength: 6 })),
    role: Type.Optional(Type.Enum(Role)),
});

export type UpdateUserBody = Static<typeof updateUserBodySchema>;

export const updateUserSchema = {
    params: Type.Object({
        id: Type.Number(),
    }),
    body: updateUserBodySchema,
    response: {
        200: userResponseSchema,
    },
};
