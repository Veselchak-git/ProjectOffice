import { Button, Input } from "@helpdesk-portal/ui-kit";
import LoginIcon from "@helpdesk-portal/icons/LoginIcon.svg?react";
import PasswordIcon from "@helpdesk-portal/icons/PasswordIcon.svg?react";
import ResetInputIcon from "@helpdesk-portal/icons/ResetInput.svg?react";
import ShowPasswordIcon from "@helpdesk-portal/icons/ShowPassword.svg?react";
import TecomLogoIcon from "@helpdesk-portal/icons/TecomLogo.svg?react";
import { useCallback, useState } from "react";
import type { FC } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";

import "./LoginPage.css";

interface LoginFormValues {
    login: string;
    password: string;
}

export const LoginPage: FC = () => {
    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        mode: "onChange",
        defaultValues: { login: "", password: "" },
    });

    const loginValue = useWatch({ control, name: "login" });
    const passwordValue = useWatch({ control, name: "password" });
    const isFilled = loginValue?.trim().length > 0 && passwordValue?.length > 0;
    const hasErrors = Object.keys(errors).length > 0;
    const canSubmit = isFilled && !hasErrors && !submitting;

    const onSubmit = useCallback(
        async (data: LoginFormValues) => {
            setServerError(null);
            setSubmitting(true);

            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });

                if (!res.ok) {
                    const body = await res.json().catch(() => null);
                    setServerError(body?.message ?? "Неверный логин или пароль");
                    return;
                }

                const body = await res.json();

                if (body.accessToken) {
                    localStorage.setItem("accessToken", body.accessToken);
                }

                navigate("/", { replace: true });
            } catch {
                setServerError("Ошибка соединения с сервером");
            } finally {
                setSubmitting(false);
            }
        },
        [navigate],
    );

    const emailError = errors.login?.message;
    const passwordError = errors.password?.message;
    const hasServerError = serverError !== null;

    return (
        <>
            <TecomLogoIcon className="login-page__logo" />

            <div className="login-page__header">
                <h2 className="login-page__heading">Вход в систему</h2>
                <h3 className="login-page__subtitle">Войдите в систему с доменной учетной записью «Теком»</h3>
            </div>
            <form className="login-page__form" onSubmit={handleSubmit(onSubmit)} noValidate onChange={() => { if (serverError) setServerError(null); }}>
                {serverError ? (
                    <div className="login-page__error-banner">{serverError}</div>
                ) : null}

                <Controller
                    name="login"
                    control={control}
                    rules={{
                        required: "Введите email",
                        pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Некорректный формат email",
                        },
                    }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            id="login"
                            label="Логин"
                            type="email"
                            inputSize="m"
                            placeholder="Введите почту"
                            autoComplete="email"
                            startIcon={<LoginIcon />}
                            endIcon={loginValue?.length > 0 ? (
                                <button className="login-page__reset-toggle" type="button" onClick={() => field.onChange("")}>
                                    <ResetInputIcon />
                                </button>
                            ) : undefined}
                            color={hasServerError || emailError ? "error" : "default"}
                            errorMessage={emailError}
                            filled={loginValue?.length > 0}
                        />
                    )}
                />

                <Controller
                    name="password"
                    control={control}
                    rules={{
                        required: "Введите пароль",
                        minLength: {
                            value: 6,
                            message: "Пароль должен содержать не менее 6 символов",
                        },
                    }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            id="password"
                            label="Пароль"
                            type={showPassword ? "text" : "password"}
                            inputSize="m"
                            placeholder="Введите пароль"
                            autoComplete="current-password"
                            startIcon={<PasswordIcon />}
                            endIcon={
                                <div className="login-page__end-icons" style={{ paddingRight: passwordValue?.length > 0 ? '12px' : '0' }}>
                                    <button className="login-page__password-toggle" type="button" onClick={() => setShowPassword(v => !v)}>
                                        <ShowPasswordIcon />
                                    </button>
                                    {passwordValue?.length > 0 ? (
                                        <button className="login-page__reset-toggle" type="button" onClick={() => field.onChange("")}>
                                            <ResetInputIcon />
                                        </button>
                                    ) : null}
                                </div>
                            }
                            color={hasServerError || passwordError ? "error" : "default"}
                            errorMessage={passwordError}
                            filled={passwordValue?.length > 0}
                        />
                    )}
                />

                <Button
                    className="login-page__submit"
                    variant="fill"
                    color="accent"
                    size="m"
                    type="submit"
                    disabled={!canSubmit}
                >
                    {submitting ? "Вход..." : "Войти"}
                </Button>
            </form>
        </>
    );
};
