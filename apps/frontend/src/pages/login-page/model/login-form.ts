import type { RegisterOptions } from "react-hook-form";

export interface LoginFormValues {
    login: string;
    password: string;
}

export const LOGIN_EMAIL_RULES: RegisterOptions<LoginFormValues, "login"> = {
    required: "Введите email",
    pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "Некорректный формат email",
    },
};

export const LOGIN_PASSWORD_RULES: RegisterOptions<LoginFormValues, "password"> = {
    required: "Введите пароль",
    minLength: {
        value: 6,
        message: "Пароль должен содержать не менее 6 символов",
    },
};
