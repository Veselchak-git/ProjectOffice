import { NS } from "@helpdesk-portal/i18n";
import LoginIcon from "@helpdesk-portal/icons/LoginIcon.svg?react";
import PasswordIcon from "@helpdesk-portal/icons/PasswordIcon.svg?react";
import ResetInputIcon from "@helpdesk-portal/icons/ResetInput.svg?react";
import ShowPasswordIcon from "@helpdesk-portal/icons/ShowPassword.svg?react";
import TecomLogoIcon from "@helpdesk-portal/icons/TecomLogo.svg?react";
import { Button, Input } from "@helpdesk-portal/ui-kit";
import { useCallback, useState } from "react";
import type { FC } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { useAuth } from "@/shared/lib/auth";

import type { LoginFormValues } from "../model/login-form";
import { getLoginEmailRules, getLoginPasswordRules } from "../model/login-form";
import "./LoginPage.css";

export const LoginPage: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginFormValues>({
        mode: "onChange",
        defaultValues: { login: "", password: "" }
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
                await login(data.login, data.password);
                navigate("/", { replace: true });
            } catch (err) {
                const message = err instanceof Error ? err.message : t(`${NS.common}:error.connection`);
                setServerError(message);
            } finally {
                setSubmitting(false);
            }
        },
        [login, navigate, t]
    );

    const emailError = errors.login?.message;
    const passwordError = errors.password?.message;
    const hasServerError = serverError !== null;

    return (
        <>
            <TecomLogoIcon className="login-page__logo" />

            <div className="login-page__header">
                <h2 className="login-page__heading">{t(`${NS.auth}:login.title`)}</h2>
                <h3 className="login-page__subtitle">{t(`${NS.auth}:login.subtitle`)}</h3>
            </div>
            <form
                className="login-page__form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                onChange={() => {
                    if (serverError) setServerError(null);
                }}
            >
                {serverError ? <div className="login-page__error-banner">{serverError}</div> : null}

                <Controller
                    name="login"
                    control={control}
                    rules={getLoginEmailRules(t)}
                    render={({ field }) => (
                        <Input
                            {...field}
                            id="login"
                            label={t(`${NS.auth}:login.email.label`)}
                            type="email"
                            inputSize="m"
                            placeholder={t(`${NS.auth}:login.email.placeholder`)}
                            autoComplete="email"
                            startIcon={<LoginIcon />}
                            endIcon={
                                loginValue?.length > 0 ? (
                                    <button
                                        className="login-page__reset-toggle"
                                        type="button"
                                        onClick={() => field.onChange("")}
                                    >
                                        <ResetInputIcon />
                                    </button>
                                ) : undefined
                            }
                            color={hasServerError || emailError ? "error" : "default"}
                            errorMessage={emailError}
                            filled={loginValue?.length > 0}
                        />
                    )}
                />

                <Controller
                    name="password"
                    control={control}
                    rules={getLoginPasswordRules(t)}
                    render={({ field }) => (
                        <Input
                            {...field}
                            id="password"
                            label={t(`${NS.auth}:login.password.label`)}
                            type={showPassword ? "text" : "password"}
                            inputSize="m"
                            placeholder={t(`${NS.auth}:login.password.placeholder`)}
                            autoComplete="current-password"
                            startIcon={<PasswordIcon />}
                            endIcon={
                                <div
                                    className="login-page__end-icons"
                                    style={{ paddingRight: passwordValue?.length > 0 ? "12px" : "0" }}
                                >
                                    <button
                                        className="login-page__password-toggle"
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                    >
                                        <ShowPasswordIcon />
                                    </button>
                                    {passwordValue?.length > 0 ? (
                                        <button
                                            className="login-page__reset-toggle"
                                            type="button"
                                            onClick={() => field.onChange("")}
                                        >
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
                    {submitting ? t(`${NS.auth}:login.submitting`) : t(`${NS.auth}:login.submit`)}
                </Button>
            </form>
        </>
    );
};
