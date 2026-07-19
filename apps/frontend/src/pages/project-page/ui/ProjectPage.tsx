/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { PROJECTS } from "@helpdesk-portal/i18n";
import ParticipantsIcon from "@helpdesk-portal/icons/Participants.svg?react";
import { Button } from "@helpdesk-portal/ui-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import type { CreateIssueData } from "@/entities/issue";
import { createIssue } from "@/entities/issue";
import { IssueForm } from "@/entities/issue";
import type { UpdateProjectData } from "@/entities/project";
import { deleteProject, fetchProject, fetchProjectMembers, updateProject } from "@/entities/project";
import { MembersListModal, ProjectForm } from "@/entities/project";

import { useAuth } from "@/shared/lib/auth";
import { formatDateTime } from "@/shared/lib/format-date";

import "./ProjectPage.css";

export const ProjectPage: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation(PROJECTS);
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [creatingIssue, setCreatingIssue] = useState(false);
    const [membersOpen, setMembersOpen] = useState(false);

    const projectId = Number(id);

    const {
        data: project,
        isPending,
        isError,
        error
    } = useQuery({
        queryKey: ["project", projectId],
        queryFn: () => fetchProject(projectId),
        enabled: !!id
    });

    const { data: projectMembers } = useQuery({
        queryKey: ["project-members", projectId],
        queryFn: () => fetchProjectMembers(projectId),
        enabled: !!project
    });

    const { mutateAsync: updateProjectMutate } = useMutation({
        mutationFn: (data: UpdateProjectData) => updateProject(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setEditing(false);
        }
    });

    const { mutateAsync: deleteProjectMutate, isPending: deleting } = useMutation({
        mutationFn: () => deleteProject(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["audit-log-available"] });
            navigate("/projects", { replace: true });
        }
    });

    const { mutateAsync: createIssueMutate } = useMutation({
        mutationFn: (dto: CreateIssueData) => createIssue(projectId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["issues"] });
            queryClient.invalidateQueries({ queryKey: ["project", projectId] });
            setCreatingIssue(false);
        }
    });

    const handleEdit = async (data: UpdateProjectData) => {
        await updateProjectMutate(data);
    };

    const handleDelete = async () => {
        if (!window.confirm(t("detail.confirmDelete"))) return;
        await deleteProjectMutate();
    };

    if (isPending) {
        return (
            <div className="project-page">
                <p className="project-page__loading">{t("loading")}</p>
            </div>
        );
    }

    if (isError || !project) {
        return (
            <div className="project-page">
                <div className="project-page__not-found">
                    <h1>{error instanceof Error ? error.message : t("detail.notFound")}</h1>
                    <Button className="project-page__back-btn" type="button" onClick={() => navigate("/projects")}>
                        {t("detail.backToList")}
                    </Button>
                </div>
            </div>
        );
    }

    if (editing) {
        return (
            <div className="project-page">
                <h1 className="project-form-title">{t("detail.editTitle")}</h1>
                <ProjectForm
                    initial={{
                        name: project.name,
                        description: project.description,
                        status: project.status,
                        versions: project.versions
                    }}
                    onSubmit={handleEdit}
                    onCancel={() => setEditing(false)}
                />
            </div>
        );
    }

    return (
        <div className="project-page">
            <Button className="project-page__back-btn" type="button" onClick={() => navigate("/projects")}>
                {t("detail.back")}
            </Button>

            <div className="project-page__card">
                <div className="project-page__header">
                    <div className="project-page__title-area">
                        <h1 className="project-page__title">{project.name}</h1>
                        <span
                            className={`project-page__status project-page__status--${project.status === "ACTIVE" ? "active" : "archived"}`}
                        >
                            {project.status === "ACTIVE" ? t("status.active") : t("status.archived")}
                        </span>
                    </div>
                    <div className="project-page__actions">
                        {(user?.role === "ADMIN" || (project.myRole && project.myRole !== "VIEWER")) && (
                            <Button onClick={() => setCreatingIssue(true)}>{t("detail.issues.create")}</Button>
                        )}
                        {(user?.role === "ADMIN" || project.myRole === "MANAGER") && (
                            <Button variant="stroke" onClick={() => setEditing(true)}>
                                {t("detail.edit")}
                            </Button>
                        )}
                        {(user?.role === "ADMIN" || project.myRole === "MANAGER") && (
                            <Button variant="stroke" color="error" onClick={handleDelete} disabled={deleting}>
                                {deleting ? t("detail.deleting") : t("detail.delete")}
                            </Button>
                        )}
                        <Button startIcon={<ParticipantsIcon />} onClick={() => setMembersOpen(true)}>
                            ({projectMembers?.length ?? 0})
                        </Button>
                    </div>
                </div>

                <div className="project-page__fields">
                    <div className="project-page__field">
                        <span className="project-page__field-label">{t("detail.info.description")}</span>
                        <span className="project-page__field-value">{project.description || "—"}</span>
                    </div>
                    <div className="project-page__field">
                        <span className="project-page__field-label">{t("detail.info.versions")}</span>
                        <div className="project-page__versions-list">
                            {project.versions.length > 0 ? (
                                project.versions.map(v => (
                                    <span key={v.id} className="project-page__version-tag">
                                        {v.version}
                                    </span>
                                ))
                            ) : (
                                <span className="project-page__field-value">—</span>
                            )}
                        </div>
                    </div>
                    <div className="project-page__field">
                        <span className="project-page__field-label">{t("detail.info.tasks")}</span>
                        <span className="project-page__field-value">{project.taskCount}</span>
                    </div>
                    <div className="project-page__field">
                        <span className="project-page__field-label">{t("detail.info.responsible")}</span>
                        <span className="project-page__field-value">{project.responsible}</span>
                    </div>
                    <div className="project-page__field">
                        <span className="project-page__field-label">{t("detail.info.created")}</span>
                        <span className="project-page__field-value">{formatDateTime(project.createdAt)}</span>
                    </div>
                </div>
            </div>

            <MembersListModal
                isOpen={membersOpen}
                onClose={() => setMembersOpen(false)}
                projectId={project.id}
                globalRole={user?.role}
                currentLogin={user?.login}
                currentUserId={user?.id ? Number(user.id) : undefined}
                projectRole={project.myRole}
            />

            {creatingIssue && (
                <div className="project-page__overlay">
                    <div className="project-page__modal">
                        <h2 className="project-page__modal-title">{t("detail.issues.createTitle")}</h2>
                        <IssueForm
                            members={projectMembers ?? []}
                            versions={project.versions}
                            onSubmit={data => createIssueMutate(data as CreateIssueData).then(() => {})}
                            onCancel={() => setCreatingIssue(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
