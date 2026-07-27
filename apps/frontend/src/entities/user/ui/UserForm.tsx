/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { COMMON, USERS } from "@helpdesk-portal/i18n";
import { Button, Input, Select, Switch } from "@helpdesk-portal/ui-kit";
import { useState } from "react";
import type { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { i18n } from "@/shared/lib/i18n";
import { getLoginEmailRules, getLoginPasswordRules } from "@/shared/lib/validation";

import type { CreateUserData } from "../model/user";
import styles from "./UserForm.module.css";

interface UserFormProps {
    onSubmit(data: CreateUserData): Promise<void>;
    onCancel(): void;
}

interface CreateFormValues {
    login: string;
    password: string;
    role: string;
}

export const UserForm: FC<UserFormProps> = ({ onSubmit, onCancel }) => {
    const { t: tu } = useTranslation(USERS);
    const [showPassword, setShowPassword] = useState(false);

    const {
        control,
        handleSubmit: rhfHandleSubmit,
        formState: { errors, isSubmitting },
        setError
    } = useForm<CreateFormValues>({
        mode: "onChange",
        defaultValues: { login: "", password: "", role: "USER" }
    });

    const loginRules = getLoginEmailRules(i18n.t);
    const passwordRules = getLoginPasswordRules(i18n.t);

    const hasErrors = Object.keys(errors).length > 0;
    const canSubmit = !hasErrors && !isSubmitting;

    const roleOptions = [
        { value: "USER", label: tu("roles.user") },
        { value: "ADMIN", label: tu("roles.admin") }
    ];

    const handleFormSubmit = async (data: CreateFormValues) => {
        try {
            await onSubmit({
                login: data.login.trim(),
                password: data.password,
                role: data.role as CreateUserData["role"]
            });
        } catch (err) {
            setError("root", { message: err instanceof Error ? err.message : i18n.t(`${USERS}:create.error`) });
        }
    };

    return (
        <form
            className={styles["user-form"]}
            onSubmit={rhfHandleSubmit(handleFormSubmit)}
            noValidate
            onChange={() => {
                if (errors.root) setError("root", { message: "" });
            }}
        >
            {errors.root?.message ? <div className={styles["user-form__error"]}>{errors.root.message}</div> : null}
            <Controller
                name="login"
                control={control}
                rules={loginRules}
                render={({ field, fieldState }) => (
                    <Input
                        {...field}
                        label={tu("form.login.label")}
                        type="email"
                        placeholder={tu("form.login.placeholder")}
                        color={fieldState.error ? "error" : "default"}
                        errorMessage={fieldState.error?.message}
                        required
                    />
                )}
            />
            <div className={styles["user-form__password-field"]}>
                <Controller
                    name="password"
                    control={control}
                    rules={passwordRules}
                    render={({ field, fieldState }) => (
                        <Input
                            {...field}
                            label={tu("form.password.label")}
                            type={showPassword ? "text" : "password"}
                            placeholder={tu("form.password.placeholder")}
                            color={fieldState.error ? "error" : "default"}
                            errorMessage={fieldState.error?.message}
                            required
                        />
                    )}
                />
                <label className={styles["user-form__checkbox-row"]}>
                    <Switch checked={showPassword} onCheckedChange={setShowPassword} />
                    <span>{tu("form.showPassword")}</span>
                </label>
            </div>
            <Controller
                name="role"
                control={control}
                render={({ field }) => (
                    <Select
                        label={tu("form.role")}
                        options={roleOptions}
                        value={field.value}
                        usePortal={false}
                        onValueChange={field.onChange}
                    />
                )}
            />
            <div className={styles["user-form__actions"]}>
                <Button type="submit" disabled={!canSubmit}>
                    {isSubmitting ? tu("create.submitting") : tu("create.submit")}
                </Button>
                <Button type="button" variant="stroke" onClick={onCancel}>
                    {tu(`${COMMON}:cancel`)}
                </Button>
            </div>
        </form>
    );
};
