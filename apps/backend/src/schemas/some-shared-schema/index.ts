/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { type Static, Type } from "@fastify/type-provider-typebox";

export const someSharedSchema = Type.Object(
    {
        name: Type.String(),
        age: Type.Number()
    },
    {
        $id: "SomeSharedSchema"
    }
);

export type SomeSharedSchema = Static<typeof someSharedSchema>;
