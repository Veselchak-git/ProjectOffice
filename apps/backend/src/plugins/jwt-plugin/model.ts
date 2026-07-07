/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { Role } from "@/generated/prisma/client.js";

export interface JwtPayload {
    sub: string;
    login: string;
    role: Role;
}
