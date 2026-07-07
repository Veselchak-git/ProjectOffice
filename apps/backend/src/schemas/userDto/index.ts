/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Role } from "@/generated/prisma/client.js";
import { type Static, Type } from "@fastify/type-provider-typebox";

export const userRoleSchema = Type.Enum(Role);
//это пример, реально регистрировать схему глобально нужно только если она
// используется в большим количестве мест во всей системе
export const userDtoSchema = Type.Object(
    {
        id: Type.Number(),
        login: Type.String(),
        role: userRoleSchema
    },
    {
        $id: "UserDto"
    }
);
export type UserDto = Static<typeof userDtoSchema>;
