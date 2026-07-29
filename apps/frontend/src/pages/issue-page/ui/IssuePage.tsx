/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { ISSUES } from "@helpdesk-portal/i18n";
import { Button } from "@helpdesk-portal/ui-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import type { CreateIssueData, IssueStatus, UpdateIssueData } from "@/entities/issue";
import { deleteIssue, fetchIssue, fetchProjectIssues, updateIssue } from "@/entities/issue";
import { IssueForm } from "@/entities/issue";
import { fetchProjectMembers } from "@/entities/project";

import { useAuth } from "@/shared/lib/auth";
import { ErrorModal } from "@/shared/lib/error-boundary/ErrorModal";
import { formatDateTime } from "@/shared/lib/format-date";

import { DetailCard } from "@/shared/ui/detail-card";
import { DetailField } from "@/shared/ui/detail-field";
import { StatusBadge } from "@/shared/ui/status-badge";

import styles from "./IssuePage.module.css";

export const IssuePage: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation(ISSUES);
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const {
        data: issue,
        isPending,
        isError,
        error
    } = useQuery({
        queryKey: ["issue", Number(id)],
        queryFn: () => fetchIssue(Number(id)),
        enabled: !!id
    });

    const { data: projectIssuesData } = useQuery({
        queryKey: ["project-issues", issue?.projectId],
        queryFn: () => fetchProjectIssues(issue!.projectId, { perPage: 1 }),
        enabled: !!issue?.projectId
    });

    const { data: members } = useQuery({
        queryKey: ["project-members", issue?.projectId],
        queryFn: () => fetchProjectMembers(issue!.projectId),
        enabled: !!issue?.projectId
    });

    const { mutateAsync: updateIssueMutate } = useMutation({
        mutationFn: (data: UpdateIssueData) => updateIssue(Number(id), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["issue", Number(id)] });
            queryClient.invalidateQueries({ queryKey: ["issues"] });
            queryClient.invalidateQueries({ queryKey: ["project-issues"] });
            setEditing(false);
        }
    });

    const { mutateAsync: deleteIssueMutate } = useMutation({
        mutationFn: () => deleteIssue(Number(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["issues"] });
            queryClient.invalidateQueries({ queryKey: ["project-issues"] });
            navigate("/tasks", { replace: true });
        }
    });

    const handleEdit = async (data: UpdateIssueData) => {
        await updateIssueMutate(data);
    };

    const handleDelete = async () => {
        if (!window.confirm(t("detail.confirmDelete"))) return;
        await deleteIssueMutate();
    };

    if (isPending) {
        return (
            <div className={styles["issue-page"]}>
                <p className={styles["issue-page__loading"]}>{t("loading")}</p>
            </div>
        );
    }

    if (!issue) {
        const errorCode = (error as { code?: string })?.code;
        const errorMessage =
            errorCode === "AUTH_FORBIDDEN"
                ? t("error.AUTH_FORBIDDEN_ISSUE", { id })
                : error instanceof Error
                  ? error.message
                  : t("error.notFound");

        return (
            <div className={styles["issue-page"]}>
                <ErrorModal isOpen message={errorMessage} onClose={() => navigate("/tasks")} onOkNavigate="/tasks" />
            </div>
        );
    }

    if (editing) {
        const versions =
            projectIssuesData?.issues.map(i => ({
                id: i.productVersionId ?? 0,
                version: i.productVersion ?? ""
            })) ?? [];

        return (
            <div className={styles["issue-page"]}>
                <h1 className={styles["issue-page__form-title"]}>{t("detail.editTitle")}</h1>
                <div className={styles["issue-page__card"]}>
                    <IssueForm
                        initial={
                            {
                                title: issue.title,
                                category: issue.category,
                                priority: issue.priority,
                                reproducibility: issue.reproducibility ?? undefined,
                                productVersionId: issue.productVersionId,
                                assigneeId: issue.assigneeId,
                                description: issue.description ?? undefined,
                                additionalInfo: issue.additionalInfo ?? undefined,
                                status: issue.status,
                                solution: issue.solution ?? undefined
                            } as Partial<CreateIssueData & { status?: IssueStatus; solution?: string }>
                        }
                        members={members ?? []}
                        versions={versions}
                        onSubmit={handleEdit}
                        onCancel={() => setEditing(false)}
                        onFormError={setFormError}
                        submitLabel={t("form.save")}
                    />
                </div>
            </div>
        );
    }

    const statusLabels: Record<string, string> = {
        NEW: t("status.new"),
        ACKNOWLEDGED: t("status.acknowledged"),
        CONFIRMED: t("status.confirmed"),
        ASSIGNED: t("status.assigned"),
        RESOLVED: t("status.resolved"),
        CLOSED: t("status.closed")
    };

    const priorityLabels: Record<string, string> = {
        CRITICAL: t("priority.critical"),
        SERIOUS: t("priority.serious"),
        MINOR: t("priority.minor"),
        GENERAL: t("priority.general")
    };

    const canEdit = user?.role === "ADMIN" || (issue.myRole && !["VIEWER", "REPORTER"].includes(issue.myRole));

    return (
        <div className={styles["issue-page"]}>
            <Button className={styles["issue-page__back-btn"]} type="button" onClick={() => navigate(-1)}>
                {t("detail.back")}
            </Button>

            <DetailCard
                header={
                    <>
                        <div className={styles["issue-page__title-area"]}>
                            <h1 className={styles["issue-page__title"]}>{issue.title}</h1>
                            <StatusBadge status={issue.status} labels={statusLabels} />
                        </div>
                        {canEdit && (
                            <div className={styles["issue-page__actions"]}>
                                <Button size="m" variant="stroke" onClick={() => setEditing(true)}>
                                    {t("detail.edit")}
                                </Button>
                                {(user?.role === "ADMIN" || issue.myRole === "MANAGER") && (
                                    <Button size="m" variant="stroke" color="error" onClick={handleDelete}>
                                        {t("detail.delete")}
                                    </Button>
                                )}
                            </div>
                        )}
                    </>
                }
            >
                <DetailField label={t("detail.info.project")}>
                    <Button
                        variant="link"
                        className={styles["issue-page__link-btn"]}
                        type="button"
                        onClick={() => navigate(`/projects/${issue.projectId}`)}
                    >
                        {issue.projectName}
                    </Button>
                </DetailField>

                <div className={styles["issue-page__row"]}>
                    <DetailField label={t("detail.info.category")}>
                        {t(`category.${issue.category.toLowerCase()}`)}
                    </DetailField>
                    <DetailField label={t("detail.info.priority")}>
                        <StatusBadge status={issue.priority} labels={priorityLabels} variant="priority" />
                    </DetailField>
                </div>

                <div className={styles["issue-page__row"]}>
                    <DetailField label={t("detail.info.reproducibility")}>
                        {issue.reproducibility ? t(`reproducibility.${issue.reproducibility.toLowerCase()}`) : "—"}
                    </DetailField>
                    <DetailField label={t("detail.info.version")}>{issue.productVersion ?? "—"}</DetailField>
                </div>

                <DetailField label={t("detail.info.description")} multiline>
                    {issue.description || "—"}
                </DetailField>

                <DetailField label={t("detail.info.additionalInfo")} multiline>
                    {issue.additionalInfo || "—"}
                </DetailField>

                <div className={styles["issue-page__row"]}>
                    <DetailField label={t("detail.info.reporter")}>{issue.reporterLogin}</DetailField>
                    <DetailField label={t("detail.info.assignee")}>{issue.assigneeLogin ?? "—"}</DetailField>
                </div>

                <div className={styles["issue-page__row"]}>
                    <DetailField label={t("detail.info.created")}>{formatDateTime(issue.createdAt)}</DetailField>
                    <DetailField label={t("detail.info.updated")}>{formatDateTime(issue.updatedAt)}</DetailField>
                </div>

                {issue.solution && (
                    <DetailField label={t("detail.info.solution")} multiline>
                        {issue.solution}
                    </DetailField>
                )}
            </DetailCard>

            <ErrorModal
                isOpen={!!formError || isError || !issue}
                message={formError ?? (error instanceof Error ? error.message : t("error.notFound"))}
                onClose={() => {
                    setFormError(null);
                    if (isError || !issue) navigate("/tasks");
                }}
                {...(!formError ? { onOkNavigate: "/tasks" } : {})}
            />
        </div>
    );
};
