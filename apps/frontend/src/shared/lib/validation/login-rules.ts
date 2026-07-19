/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { VALIDATION } from "@helpdesk-portal/i18n";

export function getLoginEmailRules(t: (key: string) => string) {
    return {
        required: t(`${VALIDATION}:required.email`),
        pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: t(`${VALIDATION}:invalid.email`)
        }
    };
}

export function getLoginPasswordRules(t: (key: string) => string) {
    return {
        required: t(`${VALIDATION}:required.password`),
        minLength: {
            value: 6,
            message: t(`${VALIDATION}:minLength.password`)
        }
    };
}
