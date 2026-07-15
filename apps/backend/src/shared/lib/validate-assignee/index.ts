/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { PrismaClient } from "@/generated/prisma/client.js";
import { Role } from "@/generated/prisma/enums.js";
import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";

export async function assertValidAssignee(
    prisma: PrismaClient,
    projectId: number,
    assigneeId: number,
): Promise<void> {
    const assigneeMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: assigneeId, projectId } },
    });
    if (!assigneeMember) {
        throw new AppError(
            HTTP_STATUS.BAD_REQUEST,
            "Пользователь не является участником проекта",
            "INVALID_ASSIGNEE",
        );
    }
    if (assigneeMember.role !== "DEVELOPER" && assigneeMember.role !== "MANAGER") {
        const assigneeUser = await prisma.user.findUnique({
            where: { id: assigneeId },
            select: { role: true },
        });
        if (assigneeUser?.role !== Role.ADMIN) {
            throw new AppError(
                HTTP_STATUS.FORBIDDEN,
                "Пользователь не может быть назначен исполнителем",
                "INVALID_ASSIGNEE_ROLE",
            );
        }
    }
}
