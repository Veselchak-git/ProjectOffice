/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import argon2 from "argon2";

export const hashPassword = async (password: string, saltSecret: string = "") => {
    return argon2.hash(password + saltSecret);
};
export const verifyPassword = async (
    password: string,
    passwordHash: string,
    saltSecret: string = ""
): Promise<boolean> => {
    return argon2.verify(passwordHash, password + saltSecret);
};
