/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { COMMON, ISSUES } from "@helpdesk-portal/i18n";
import { Button, Input, Select } from "@helpdesk-portal/ui-kit";
import { useState } from "react";
import type { FC, FormEvent } from "react";
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

export const IssueForm: FC<IssueFormProps> = ({ initial, versions, members, onSubmit, onCancel, submitLabel }) => {
    const { t } = useTranslation(ISSUES);
    const [title, setTitle] = useState(initial?.title ?? "");
    const [category, setCategory] = useState<IssueCategory>((initial?.category as IssueCategory) ?? "BUG");
    const [priority, setPriority] = useState<IssuePriority>((initial?.priority as IssuePriority) ?? "GENERAL");
    const [reproducibility, setReproducibility] = useState<Reproducibility | "">(
        (initial?.reproducibility as Reproducibility) ?? ""
    );
    const [productVersionId, setProductVersionId] = useState<number | "">(initial?.productVersionId ?? "");
    const [assigneeId, setAssigneeId] = useState<number | null>(initial?.assigneeId ?? null);
    const [description, setDescription] = useState(initial?.description ?? "");
    const [additionalInfo, setAdditionalInfo] = useState(initial?.additionalInfo ?? "");
    const [status, setStatus] = useState<IssueStatus>((initial?.status as IssueStatus) ?? "NEW");
    const [solution, setSolution] = useState(initial?.solution ?? "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setError(null);
        setFieldErrors({});
        setSubmitting(true);
        try {
            const result: CreateIssueData & { status?: IssueStatus; solution?: string } = {
                title: title.trim(),
                category,
                priority
            };
            if (reproducibility) result.reproducibility = reproducibility;
            if (productVersionId) result.productVersionId = Number(productVersionId);
            else result.productVersionId = null;
            if (description) result.description = description;
            if (additionalInfo) result.additionalInfo = additionalInfo;
            result.assigneeId = assigneeId;
            if (initial?.status) {
                result.status = status;
                if (solution) result.solution = solution;
            }
            await onSubmit(result);
        } catch (err: unknown) {
            const code = (err as Error & { code?: string }).code;
            const message = err instanceof Error ? err.message : t("error.update");

            const fieldMap: Record<string, string> = {
                AUTH_FORBIDDEN_ASSIGNEE: "assigneeId",
                AUTH_FORBIDDEN_STATUS_RESOLVED: "status",
                AUTH_FORBIDDEN_STATUS_CLOSED: "status",
                AUTH_FORBIDDEN_STATUS_NEW: "status"
            };

            const fieldName = code ? fieldMap[code] : undefined;
            if (fieldName) {
                setFieldErrors(prev => ({ ...prev, [fieldName]: t(`error.${code}`, { defaultValue: message }) }));
            } else {
                setError(code ? t(`error.${code}`, { defaultValue: message }) : message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="issue-form" onSubmit={handleSubmit}>
            {error && <div className="issue-form__error">{error}</div>}
            <Input
                label={t("form.title.label")}
                placeholder={t("form.title.placeholder")}
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
            />

            <div className="issue-form__row">
                <div className="issue-form__field">
                    <label className="issue-form__label">{t("form.category.label")}</label>
                    <Select
                        usePortal={false}
                        options={[
                            { value: "BUG", label: t("category.bug") },
                            { value: "FEATURE", label: t("category.feature") },
                            { value: "TASK", label: t("category.task") },
                            { value: "IMPROVEMENT", label: t("category.improvement") },
                            { value: "QUESTION", label: t("category.question") }
                        ]}
                        value={category}
                        onValueChange={val => setCategory(val as IssueCategory)}
                    />
                </div>

                <div className="issue-form__field">
                    <label className="issue-form__label">{t("form.priority.label")}</label>
                    <Select
                        usePortal={false}
                        options={[
                            { value: "CRITICAL", label: t("priority.critical") },
                            { value: "SERIOUS", label: t("priority.serious") },
                            { value: "MINOR", label: t("priority.minor") },
                            { value: "GENERAL", label: t("priority.general") }
                        ]}
                        value={priority}
                        onValueChange={val => setPriority(val as IssuePriority)}
                    />
                </div>
            </div>

            <div className="issue-form__row">
                <div className="issue-form__field">
                    <label className="issue-form__label">{t("form.reproducibility.label")}</label>
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
                        value={reproducibility}
                        onValueChange={val => setReproducibility(val as Reproducibility | "")}
                    />
                </div>

                <div className="issue-form__field">
                    <label className="issue-form__label">{t("form.version.label")}</label>
                    <Select
                        usePortal={false}
                        options={[
                            { value: "", label: t("form.version.none") },
                            ...(versions ?? []).map(v => ({
                                value: String(v.id),
                                label: v.version
                            }))
                        ]}
                        value={String(productVersionId)}
                        onValueChange={val => setProductVersionId(val ? Number(val) : "")}
                    />
                </div>
            </div>

            {members && members.length > 0 && (
                <div className="issue-form__field">
                    <label className="issue-form__label">{t("form.assignee.label")}</label>
                    <Select
                        usePortal={false}
                        color={fieldErrors.assigneeId ? "error" : "default"}
                        errorMessage={fieldErrors.assigneeId ?? ""}
                        options={[
                            { value: "", label: t("form.assignee.none") },
                            ...members
                                .filter(m => m.role === "DEVELOPER" || m.role === "MANAGER")
                                .map(m => ({ value: String(m.userId), label: m.login }))
                        ]}
                        value={String(assigneeId ?? "")}
                        onValueChange={val => {
                            setAssigneeId(val ? Number(val) : null);
                            setFieldErrors(prev => {
                                const next = { ...prev };
                                delete next.assigneeId;
                                return next;
                            });
                        }}
                    />
                </div>
            )}

            {initial?.status && (
                <div className="issue-form__field">
                    <label className="issue-form__label">{t("form.status.label")}</label>
                    <Select
                        usePortal={false}
                        color={fieldErrors.status ? "error" : "default"}
                        errorMessage={fieldErrors.status ?? ""}
                        options={[
                            { value: "NEW", label: t("status.new") },
                            { value: "ACKNOWLEDGED", label: t("status.acknowledged") },
                            { value: "CONFIRMED", label: t("status.confirmed") },
                            { value: "ASSIGNED", label: t("status.assigned") },
                            { value: "RESOLVED", label: t("status.resolved") },
                            { value: "CLOSED", label: t("status.closed") }
                        ]}
                        value={status}
                        onValueChange={val => {
                            setStatus(val as IssueStatus);
                            setFieldErrors(prev => {
                                const next = { ...prev };
                                delete next.status;
                                return next;
                            });
                        }}
                    />
                </div>
            )}

            <div className="issue-form__field">
                <label className="issue-form__label">{t("form.description.label")}</label>
                <textarea
                    className="issue-form__textarea"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={t("form.description.placeholder")}
                    rows={3}
                />
            </div>

            <div className="issue-form__field">
                <label className="issue-form__label">{t("form.additionalInfo.label")}</label>
                <textarea
                    className="issue-form__textarea"
                    value={additionalInfo}
                    onChange={e => setAdditionalInfo(e.target.value)}
                    placeholder={t("form.additionalInfo.placeholder")}
                    rows={2}
                />
            </div>

            {initial?.status && (
                <div className="issue-form__field">
                    <label className="issue-form__label">{t("form.solution.label")}</label>
                    <textarea
                        className="issue-form__textarea"
                        value={solution}
                        onChange={e => setSolution(e.target.value)}
                        placeholder={t("form.solution.placeholder")}
                        rows={2}
                    />
                </div>
            )}

            <div className="issue-form__actions">
                <Button type="submit" disabled={submitting || !title.trim()}>
                    {submitting ? t(`${COMMON}:saving`) : (submitLabel ?? t("form.submit"))}
                </Button>
                <Button type="button" variant="stroke" onClick={onCancel} disabled={submitting}>
                    {t("form.cancel")}
                </Button>
            </div>
        </form>
    );
};
