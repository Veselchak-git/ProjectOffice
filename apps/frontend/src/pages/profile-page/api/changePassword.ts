/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { AUTH } from "@helpdesk-portal/i18n";

import { handleApiResponse } from "@/shared/lib/api";
import { apiClient } from "@/shared/lib/auth";

import type { ChangePasswordFormValues } from "../model/change-password-form";

export async function changePasswordRequest(data: ChangePasswordFormValues): Promise<void> {
    const res = await apiClient("/api/auth/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword
        })
    });

    await handleApiResponse<void>(res, AUTH, "profile.error.changePassword");
}
