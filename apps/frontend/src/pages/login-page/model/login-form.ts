/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { getLoginEmailRules, getLoginPasswordRules } from "@/shared/lib/validation";

export interface LoginFormValues {
    login: string;
    password: string;
}

export { getLoginEmailRules, getLoginPasswordRules };
