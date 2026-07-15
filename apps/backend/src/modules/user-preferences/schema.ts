import { type Static, Type } from "@fastify/type-provider-typebox";

export const getPreferencesQuerySchema = Type.Object({
    page: Type.String({ minLength: 1 }),
});

export type GetPreferencesQuery = Static<typeof getPreferencesQuerySchema>;

export const tableSettingsSchema = Type.Object({
    columnVisibility: Type.Record(Type.String(), Type.Boolean()),
    columnOrder: Type.Array(Type.String()),
});

export type TableSettings = Static<typeof tableSettingsSchema>;

export const getPreferencesResponseSchema = Type.Object({
    settings: Type.Optional(tableSettingsSchema),
});

export type GetPreferencesResponse = Static<typeof getPreferencesResponseSchema>;

export const getPreferencesSchema = {
    querystring: getPreferencesQuerySchema,
    response: {
        200: getPreferencesResponseSchema,
    },
};

export const putPreferencesBodySchema = Type.Object({
    page: Type.String({ minLength: 1 }),
    settings: tableSettingsSchema,
});

export type PutPreferencesBody = Static<typeof putPreferencesBodySchema>;

export const putPreferencesResponseSchema = Type.Object({
    settings: tableSettingsSchema,
});

export type PutPreferencesResponse = Static<typeof putPreferencesResponseSchema>;

export const putPreferencesSchema = {
    body: putPreferencesBodySchema,
    response: {
        200: putPreferencesResponseSchema,
    },
};
