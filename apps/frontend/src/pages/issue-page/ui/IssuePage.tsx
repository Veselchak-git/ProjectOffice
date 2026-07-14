import { NS } from "@helpdesk-portal/i18n";
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
import { formatDateTime } from "@/shared/lib/format-date";

import "./IssuePage.css";

export const IssuePage: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation(NS.issues);
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);

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
            <div className="issue-page">
                <p className="issue-page__loading">{t("loading")}</p>
            </div>
        );
    }

    if (isError || !issue) {
        return (
            <div className="issue-page">
                <div className="issue-page__not-found">
                    <h1>{error instanceof Error ? error.message : t("error.notFound")}</h1>
                    <button className="issue-page__back-btn" type="button" onClick={() => navigate("/tasks")}>
                        {t("detail.backToList")}
                    </button>
                </div>
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
            <div className="issue-page">
                <h1 className="issue-page__form-title">{t("detail.editTitle")}</h1>
                <div className="issue-page__card">
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
        <div className="issue-page">
            <button className="issue-page__back-btn" type="button" onClick={() => navigate(-1)}>
                {t("detail.back")}
            </button>

            <div className="issue-page__card">
                <div className="issue-page__header">
                    <div className="issue-page__title-area">
                        <h1 className="issue-page__title">{issue.title}</h1>
                        <span
                            className={`issue-page__status-badge issue-page__status-badge--${issue.status.toLowerCase()}`}
                        >
                            {statusLabels[issue.status] ?? issue.status}
                        </span>
                    </div>
                    {canEdit && (
                        <div className="issue-page__actions">
                            <Button variant="stroke" onClick={() => setEditing(true)}>
                                {t("detail.edit")}
                            </Button>
                            {(user?.role === "ADMIN" || issue.myRole === "MANAGER") && (
                                <Button variant="stroke" color="error" onClick={handleDelete}>
                                    {t("detail.delete")}
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <div className="issue-page__fields">
                    <div className="issue-page__field">
                        <span className="issue-page__field-label">{t("detail.info.project")}</span>
                        <span className="issue-page__field-value">
                            <button
                                className="issue-page__link-btn"
                                type="button"
                                onClick={() => navigate(`/projects/${issue.projectId}`)}
                            >
                                {issue.projectName}
                            </button>
                        </span>
                    </div>

                    <div className="issue-page__row">
                        <div className="issue-page__field">
                            <span className="issue-page__field-label">{t("detail.info.category")}</span>
                            <span className="issue-page__field-value">
                                {t(`category.${issue.category.toLowerCase()}`)}
                            </span>
                        </div>
                        <div className="issue-page__field">
                            <span className="issue-page__field-label">{t("detail.info.priority")}</span>
                            <span
                                className={`issue-page__priority-value issue-page__priority-value--${issue.priority.toLowerCase()}`}
                            >
                                {priorityLabels[issue.priority] ?? issue.priority}
                            </span>
                        </div>
                    </div>

                    <div className="issue-page__row">
                        <div className="issue-page__field">
                            <span className="issue-page__field-label">{t("detail.info.reproducibility")}</span>
                            <span className="issue-page__field-value">
                                {issue.reproducibility
                                    ? t(`reproducibility.${issue.reproducibility.toLowerCase()}`)
                                    : "—"}
                            </span>
                        </div>
                        <div className="issue-page__field">
                            <span className="issue-page__field-label">{t("detail.info.version")}</span>
                            <span className="issue-page__field-value">{issue.productVersion ?? "—"}</span>
                        </div>
                    </div>

                    <div className="issue-page__field">
                        <span className="issue-page__field-label">{t("detail.info.description")}</span>
                        <span className="issue-page__field-value issue-page__field-value--multiline">
                            {issue.description || "—"}
                        </span>
                    </div>

                    <div className="issue-page__field">
                        <span className="issue-page__field-label">{t("detail.info.additionalInfo")}</span>
                        <span className="issue-page__field-value issue-page__field-value--multiline">
                            {issue.additionalInfo || "—"}
                        </span>
                    </div>

                    <div className="issue-page__row">
                        <div className="issue-page__field">
                            <span className="issue-page__field-label">{t("detail.info.reporter")}</span>
                            <span className="issue-page__field-value">{issue.reporterLogin}</span>
                        </div>
                        <div className="issue-page__field">
                            <span className="issue-page__field-label">{t("detail.info.assignee")}</span>
                            <span className="issue-page__field-value">{issue.assigneeLogin ?? "—"}</span>
                        </div>
                    </div>

                    <div className="issue-page__row">
                        <div className="issue-page__field">
                            <span className="issue-page__field-label">{t("detail.info.created")}</span>
                            <span className="issue-page__field-value">{formatDateTime(issue.createdAt)}</span>
                        </div>
                        <div className="issue-page__field">
                            <span className="issue-page__field-label">{t("detail.info.updated")}</span>
                            <span className="issue-page__field-value">{formatDateTime(issue.updatedAt)}</span>
                        </div>
                    </div>

                    {issue.solution && (
                        <div className="issue-page__field">
                            <span className="issue-page__field-label">{t("detail.info.solution")}</span>
                            <span className="issue-page__field-value issue-page__field-value--multiline">
                                {issue.solution}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
