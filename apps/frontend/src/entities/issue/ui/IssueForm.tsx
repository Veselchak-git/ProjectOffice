/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { COMMON, ISSUES } from "@helpdesk-portal/i18n";
import { Button, Input, Select } from "@helpdesk-portal/ui-kit";
import type { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { Member } from "@/entities/project";

import type { CreateIssueData, IssueCategory, IssuePriority, IssueStatus, Reproducibility } from "../model/issue";
import "./IssueForm.css";

interface IssueFormProps {
    initial?: Partial<CreateIssueData & { status?: IssueStatus; solution?: string }>;
    versions?: { id: number; version: string }[];
    members?: Member[];
    onSubmit: (data: CreateIssueData & { status?: IssueStatus; solution?: string }) => Promise<void> | void;
    onCancel: () => void;
    submitLabel?: string;
}

interface IssueFormValues {
    title: string;
    category: IssueCategory;
    priority: IssuePriority;
    reproducibility: Reproducibility | "";
    productVersionId: number | "";
    assigneeId: number | null;
    description: string;
    additionalInfo: string;
    status: IssueStatus;
    solution: string;
}

export const IssueForm: FC<IssueFormProps> = ({ initial, versions, members, onSubmit, onCancel, submitLabel }) => {
    const { t } = useTranslation(ISSUES);

    const {
        control,
        handleSubmit,
        watch,
        clearErrors,
        formState: { isSubmitting, errors },
        setError
    } = useForm<IssueFormValues>({
        mode: "onChange",
        defaultValues: {
            title: initial?.title ?? "",
            category: (initial?.category as IssueCategory) ?? "BUG",
            priority: (initial?.priority as IssuePriority) ?? "GENERAL",
            reproducibility: (initial?.reproducibility as Reproducibility) ?? "",
            productVersionId: initial?.productVersionId ?? "",
            assigneeId: initial?.assigneeId ?? null,
            description: initial?.description ?? "",
            additionalInfo: initial?.additionalInfo ?? "",
            status: (initial?.status as IssueStatus) ?? "NEW",
            solution: initial?.solution ?? ""
        }
    });

    const title = watch("title");

    const fieldMap: Record<string, string> = {
        AUTH_FORBIDDEN_ASSIGNEE: "assigneeId",
        AUTH_FORBIDDEN_STATUS_RESOLVED: "status",
        AUTH_FORBIDDEN_STATUS_CLOSED: "status",
        AUTH_FORBIDDEN_STATUS_NEW: "status"
    };

    const handleFormSubmit = async (data: IssueFormValues) => {
        if (!data.title.trim()) return;

        try {
            const result: CreateIssueData & { status?: IssueStatus; solution?: string } = {
                title: data.title.trim(),
                category: data.category,
                priority: data.priority
            };
            if (data.reproducibility) result.reproducibility = data.reproducibility;
            if (data.productVersionId) result.productVersionId = Number(data.productVersionId);
            else result.productVersionId = null;
            if (data.description) result.description = data.description;
            if (data.additionalInfo) result.additionalInfo = data.additionalInfo;
            result.assigneeId = data.assigneeId;
            if (initial?.status) {
                result.status = data.status;
                if (data.solution) result.solution = data.solution;
            }
            await onSubmit(result);
        } catch (err: unknown) {
            const code = (err as Error & { code?: string }).code;
            const message = err instanceof Error ? err.message : t("error.update");

            const fieldName = code ? fieldMap[code] : undefined;
            if (fieldName) {
                setError(fieldName as keyof IssueFormValues, {
                    type: "server",
                    message: t(`error.${code}`, { defaultValue: message })
                });
            } else {
                setError("root", { message: code ? t(`error.${code}`, { defaultValue: message }) : message });
            }
        }
    };

    return (
        <form className="issue-form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
            {errors.root?.message && <div className="issue-form__error">{errors.root.message}</div>}

            <Controller
                name="title"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                    <Input
                        {...field}
                        label={t("form.title.label")}
                        placeholder={t("form.title.placeholder")}
                        required
                    />
                )}
            />

            <div className="issue-form__row">
                <div className="issue-form__field">
                    <label className="issue-form__label">{t("form.category.label")}</label>
                    <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                            <Select
                                usePortal={false}
                                options={[
                                    { value: "BUG", label: t("category.bug") },
                                    { value: "FEATURE", label: t("category.feature") },
                                    { value: "TASK", label: t("category.task") },
                                    { value: "IMPROVEMENT", label: t("category.improvement") },
                                    { value: "QUESTION", label: t("category.question") }
                                ]}
                                value={field.value}
                                onValueChange={field.onChange}
                            />
                        )}
                    />
                </div>

                <div className="issue-form__field">
                    <label className="issue-form__label">{t("form.priority.label")}</label>
                    <Controller
                        name="priority"
                        control={control}
                        render={({ field }) => (
                            <Select
                                usePortal={false}
                                options={[
                                    { value: "CRITICAL", label: t("priority.critical") },
                                    { value: "SERIOUS", label: t("priority.serious") },
                                    { value: "MINOR", label: t("priority.minor") },
                                    { value: "GENERAL", label: t("priority.general") }
                                ]}
                                value={field.value}
                                onValueChange={field.onChange}
                            />
                        )}
                    />
                </div>
            </div>

            <div className="issue-form__row">
                <div className="issue-form__field">
                    <label className="issue-form__label">{t("form.reproducibility.label")}</label>
                    <Controller
                        name="reproducibility"
                        control={control}
                        render={({ field }) => (
                            <Select
                                usePortal={false}
                                options={[
                                    { value: "", label: t("form.reproducibility.none") },
                                    { value: "ALWAYS", label: t("reproducibility.always") },
                                    { value: "SOMETIMES", label: t("reproducibility.sometimes") },
                                    { value: "RANDOMLY", label: t("reproducibility.randomly") },
                                    { value: "NOT_REPRODUCIBLE", label: t("reproducibility.not_reproducible") },
                                    { value: "NOT_ATTEMPTED", label: t("reproducibility.not_attempted") }
                                ]}
                                value={field.value}
                                onValueChange={field.onChange}
                            />
                        )}
                    />
                </div>

                <div className="issue-form__field">
                    <label className="issue-form__label">{t("form.version.label")}</label>
                    <Controller
                        name="productVersionId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                usePortal={false}
                                options={[
                                    { value: "", label: t("form.version.none") },
                                    ...(versions ?? []).map(v => ({
                                        value: String(v.id),
                                        label: v.version
                                    }))
                                ]}
                                value={String(field.value)}
                                onValueChange={val => field.onChange(val ? Number(val) : "")}
                            />
                        )}
                    />
                </div>
            </div>

            {members && members.length > 0 && (
                <div className="issue-form__field">
                    <label className="issue-form__label">{t("form.assignee.label")}</label>
                    <Controller
                        name="assigneeId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                usePortal={false}
                                color={errors.assigneeId ? "error" : "default"}
                                errorMessage={errors.assigneeId?.message ?? ""}
                                options={[
                                    { value: "", label: t("form.assignee.none") },
                                    ...members
                                        .filter(m => m.role === "DEVELOPER" || m.role === "MANAGER")
                                        .map(m => ({ value: String(m.userId), label: m.login }))
                                ]}
                                value={String(field.value ?? "")}
                                onValueChange={val => {
                                    field.onChange(val ? Number(val) : null);
                                    clearErrors("assigneeId");
                                }}
                            />
                        )}
                    />
                </div>
            )}

            {initial?.status && (
                <div className="issue-form__field">
                    <label className="issue-form__label">{t("form.status.label")}</label>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <Select
                                usePortal={false}
                                color={errors.status ? "error" : "default"}
                                errorMessage={errors.status?.message ?? ""}
                                options={[
                                    { value: "NEW", label: t("status.new") },
                                    { value: "ACKNOWLEDGED", label: t("status.acknowledged") },
                                    { value: "CONFIRMED", label: t("status.confirmed") },
                                    { value: "ASSIGNED", label: t("status.assigned") },
                                    { value: "RESOLVED", label: t("status.resolved") },
                                    { value: "CLOSED", label: t("status.closed") }
                                ]}
                                value={field.value}
                                onValueChange={val => {
                                    field.onChange(val as IssueStatus);
                                    clearErrors("status");
                                }}
                            />
                        )}
                    />
                </div>
            )}

            <div className="issue-form__field">
                <label className="issue-form__label">{t("form.description.label")}</label>
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <textarea
                            className="issue-form__textarea"
                            {...field}
                            placeholder={t("form.description.placeholder")}
                            rows={3}
                        />
                    )}
                />
            </div>

            <div className="issue-form__field">
                <label className="issue-form__label">{t("form.additionalInfo.label")}</label>
                <Controller
                    name="additionalInfo"
                    control={control}
                    render={({ field }) => (
                        <textarea
                            className="issue-form__textarea"
                            {...field}
                            placeholder={t("form.additionalInfo.placeholder")}
                            rows={2}
                        />
                    )}
                />
            </div>

            {initial?.status && (
                <div className="issue-form__field">
                    <label className="issue-form__label">{t("form.solution.label")}</label>
                    <Controller
                        name="solution"
                        control={control}
                        render={({ field }) => (
                            <textarea
                                className="issue-form__textarea"
                                {...field}
                                placeholder={t("form.solution.placeholder")}
                                rows={2}
                            />
                        )}
                    />
                </div>
            )}

            <div className="issue-form__actions">
                <Button type="submit" disabled={isSubmitting || !title?.trim()}>
                    {isSubmitting ? t(`${COMMON}:saving`) : (submitLabel ?? t("form.submit"))}
                </Button>
                <Button type="button" variant="stroke" onClick={onCancel} disabled={isSubmitting}>
                    {t("form.cancel")}
                </Button>
            </div>
        </form>
    );
};
