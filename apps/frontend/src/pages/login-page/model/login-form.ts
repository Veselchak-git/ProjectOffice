import type { RegisterOptions } from "react-hook-form";

export interface LoginFormValues {
    login: string;
    password: string;
}

export function getLoginEmailRules(t: (key: string) => string): RegisterOptions<LoginFormValues, "login"> {
    return {
        required: t("validation:required.email"),
        pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: t("validation:invalid.email")
        }
    };
}

export function getLoginPasswordRules(t: (key: string) => string): RegisterOptions<LoginFormValues, "password"> {
    return {
        required: t("validation:required.password"),
        minLength: {
            value: 6,
            message: t("validation:minLength.password")
        }
    };
}
