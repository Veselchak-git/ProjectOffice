import { Role } from "@/generated/prisma/client.js";
import { type Static, Type } from "@fastify/type-provider-typebox";

import { createPaginationQueryFields } from "@/schemas/pagination-query/index.js";

export const userResponseSchema = Type.Object({
    id: Type.Number(),
    login: Type.String(),
    role: Type.Enum(Role),
    createdAt: Type.String(),
});

export type UserResponse = Static<typeof userResponseSchema>;

export const getUsersQuerySchema = Type.Object({
    ...createPaginationQueryFields({
        sortBy: "id",
        sortOrder: "asc",
    }),
    filter: Type.Optional(Type.String()),
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

export const getUsersExportQuerySchema = Type.Object({
    filter: Type.Optional(Type.String()),
    sortBy: Type.Optional(Type.String()),
    sortOrder: Type.Optional(Type.Union([Type.Literal("asc"), Type.Literal("desc")])),
});

export type GetUsersExportQuery = Static<typeof getUsersExportQuerySchema>;

export const usersExportResponseSchema = Type.Object({
    users: Type.Array(userResponseSchema),
});

export type UsersExportResponse = Static<typeof usersExportResponseSchema>;

export const getUsersExportSchema = {
    querystring: getUsersExportQuerySchema,
    response: {
        200: usersExportResponseSchema,
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
