/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { AUTH, COMMON, VALIDATION } from "@helpdesk-portal/i18n";
import PasswordIcon from "@helpdesk-portal/icons/PasswordIcon.svg?react";
import ResetInputIcon from "@helpdesk-portal/icons/ResetInput.svg?react";
import UserIcon from "@helpdesk-portal/icons/User.svg?react";
import { Button, Input } from "@helpdesk-portal/ui-kit";
import { useCallback, useState } from "react";
import type { FC } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { changePasswordRequest } from "../api/changePassword";
import type { ChangePasswordFormValues } from "../model/change-password-form";
import "./ProfilePage.css";

export const ProfilePage: FC = () => {
    const { t } = useTranslation();
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<ChangePasswordFormValues>({
        mode: "onChange",
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
    });

    const currentValue = useWatch({ control, name: "currentPassword" });
    const newValue = useWatch({ control, name: "newPassword" });
    const confirmValue = useWatch({ control, name: "confirmPassword" });

    const isFilled = currentValue?.length > 0 && newValue?.length >= 6 && confirmValue?.length >= 6;
    const hasErrors = Object.keys(errors).length > 0;
    const canSubmit = isFilled && !hasErrors && !submitting;

    const onSubmit = useCallback(
        async (data: ChangePasswordFormValues) => {
            setServerError(null);
            setSuccessMessage(null);
            setSubmitting(true);

            try {
                if (data.newPassword !== data.confirmPassword) {
                    throw new Error(t(`${AUTH}:profile.error.notMatch`));
                }

                await changePasswordRequest(data);
                setSuccessMessage(t(`${AUTH}:profile.success`));
                reset();
            } catch (err) {
                const message = err instanceof Error ? err.message : t(`${COMMON}:error.connection`);
                setServerError(message);
            } finally {
                setSubmitting(false);
            }
        },
        [reset, t]
    );

    const currentError = errors.currentPassword?.message;
    const newError = errors.newPassword?.message;
    const confirmError = errors.confirmPassword?.message;

    return (
        <div className="profile-page">
            <div className="profile-page__header">
                <UserIcon />
                <h2 className="profile-page__title">{t(`${AUTH}:profile.title`)}</h2>
            </div>

            <form
                className="profile-page__form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                onChange={() => {
                    if (serverError) setServerError(null);
                    if (successMessage) setSuccessMessage(null);
                }}
            >
                {serverError ? <div className="profile-page__error-banner">{serverError}</div> : null}
                {successMessage ? <div className="profile-page__success-banner">{successMessage}</div> : null}

                <Controller
                    name="currentPassword"
                    control={control}
                    rules={{ required: t(`${VALIDATION}:required.password`) }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            id="currentPassword"
                            label={t(`${AUTH}:profile.currentPassword.label`)}
                            type={showPasswords ? "text" : "password"}
                            inputSize="m"
                            placeholder={t(`${AUTH}:profile.currentPassword.placeholder`)}
                            autoComplete="current-password"
                            startIcon={<PasswordIcon />}
                            endIcon={
                                currentValue?.length > 0 ? (
                                    <button
                                        className="profile-page__reset"
                                        type="button"
                                        onClick={() => field.onChange("")}
                                    >
                                        <ResetInputIcon />
                                    </button>
                                ) : undefined
                            }
                            color={serverError || currentError ? "error" : "default"}
                            errorMessage={currentError}
                            filled={currentValue?.length > 0}
                        />
                    )}
                />

                <Controller
                    name="newPassword"
                    control={control}
                    rules={{
                        required: t(`${VALIDATION}:required.password`),
                        minLength: { value: 6, message: t(`${VALIDATION}:minLength.password`) }
                    }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            id="newPassword"
                            label={t(`${AUTH}:profile.newPassword.label`)}
                            type={showPasswords ? "text" : "password"}
                            inputSize="m"
                            placeholder={t(`${AUTH}:profile.newPassword.placeholder`)}
                            autoComplete="new-password"
                            startIcon={<PasswordIcon />}
                            endIcon={
                                newValue?.length > 0 ? (
                                    <button
                                        className="profile-page__reset"
                                        type="button"
                                        onClick={() => field.onChange("")}
                                    >
                                        <ResetInputIcon />
                                    </button>
                                ) : undefined
                            }
                            color={newError ? "error" : "default"}
                            errorMessage={newError}
                            filled={newValue?.length > 0}
                        />
                    )}
                />

                <Controller
                    name="confirmPassword"
                    control={control}
                    rules={{
                        required: t(`${AUTH}:profile.confirmPassword.placeholder`),
                        validate: value => value === newValue || t(`${VALIDATION}:passwords.notMatch`)
                    }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            id="confirmPassword"
                            label={t(`${AUTH}:profile.confirmPassword.label`)}
                            type={showPasswords ? "text" : "password"}
                            inputSize="m"
                            placeholder={t(`${AUTH}:profile.confirmPassword.placeholder`)}
                            autoComplete="new-password"
                            startIcon={<PasswordIcon />}
                            endIcon={
                                confirmValue?.length > 0 ? (
                                    <button
                                        className="profile-page__reset"
                                        type="button"
                                        onClick={() => field.onChange("")}
                                    >
                                        <ResetInputIcon />
                                    </button>
                                ) : undefined
                            }
                            color={confirmError ? "error" : "default"}
                            errorMessage={confirmError}
                            filled={confirmValue?.length > 0}
                        />
                    )}
                />

                <label className="profile-page__show-all">
                    <input type="checkbox" checked={showPasswords} onChange={() => setShowPasswords(v => !v)} />
                    <span>{t(`${AUTH}:profile.showPasswords`)}</span>
                </label>

                <Button
                    className="profile-page__submit"
                    variant="fill"
                    color="accent"
                    size="m"
                    type="submit"
                    disabled={!canSubmit}
                >
                    {submitting ? t(`${AUTH}:profile.submitting`) : t(`${AUTH}:profile.submit`)}
                </Button>
            </form>
        </div>
    );
};
