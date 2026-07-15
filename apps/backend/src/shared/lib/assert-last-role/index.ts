/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";

type CountClient = {
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
};

export async function assertNotLastOfRole(
    model: CountClient,
    where: Record<string, unknown>,
    message: string,
    code: string,
): Promise<void> {
    const count = await model.count({ where });
    if (count <= 1) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, message, code);
    }
}
