import { NS } from "@helpdesk-portal/i18n";
import { Button } from "@helpdesk-portal/ui-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useReducer, useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import type { CreateIssueData } from "@/entities/issue";
import { createIssue } from "@/entities/issue";
import { IssueForm } from "@/entities/issue";
import type { Project, UpdateProjectData } from "@/entities/project";
import { deleteProject, fetchProject, fetchProjectMembers, updateProject } from "@/entities/project";
import { MembersBlock, ProjectForm } from "@/entities/project";

import { useAuth } from "@/shared/lib/auth";
import { formatDateTime } from "@/shared/lib/format-date";

import "./ProjectPage.css";

interface ProjectPageState {
    project: Project | null;
    loading: boolean;
    fetchError: string | null;
}

type ProjectPageAction = { type: "start" } | { type: "success"; project: Project } | { type: "error"; message: string };

const projectReducer = (_state: ProjectPageState, action: ProjectPageAction): ProjectPageState => {
    switch (action.type) {
        case "start":
            return { project: null, loading: true, fetchError: null };
        case "success":
            return { project: action.project, loading: false, fetchError: null };
        case "error":
            return { project: null, loading: false, fetchError: action.message };
    }
};

export const ProjectPage: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation(NS.projects);
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [{ project, loading, fetchError }, dispatch] = useReducer(projectReducer, {
        project: null,
        loading: true,
        fetchError: null
    });
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [creatingIssue, setCreatingIssue] = useState(false);

    const projectId = Number(id);

    const { data: projectMembers } = useQuery({
        queryKey: ["project-members", projectId],
        queryFn: () => fetchProjectMembers(projectId),
        enabled: !!project && !loading
    });

    const { mutateAsync: createIssueMutate } = useMutation({
        mutationFn: (dto: CreateIssueData) => createIssue(projectId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["issues"] });
            setCreatingIssue(false);
        }
    });

    useEffect(() => {
        dispatch({ type: "start" });
        let cancelled = false;
        fetchProject(Number(id))
            .then(data => {
                if (!cancelled) dispatch({ type: "success", project: data });
            })
            .catch(err => {
                if (!cancelled) dispatch({ type: "error", message: err.message });
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleEdit = async (data: UpdateProjectData) => {
        await updateProject(Number(id), data);
        setEditing(false);
        dispatch({ type: "start" });
        fetchProject(Number(id))
            .then(data => dispatch({ type: "success", project: data }))
            .catch(err => dispatch({ type: "error", message: err.message }));
    };

    const handleDelete = async () => {
        if (!window.confirm(t("detail.confirmDelete"))) return;
        setDeleting(true);
        try {
            await deleteProject(Number(id));
            queryClient.invalidateQueries({ queryKey: ["audit-log-available"] });
            navigate("/projects", { replace: true });
        } catch {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="project-page">
                <p className="project-page__loading">{t("loading")}</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="project-page">
                <p className="project-page__error">{fetchError}</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="project-page">
                <div className="project-page__not-found">
                    <h1>{t("detail.notFound")}</h1>
                    <button className="project-page__back-btn" type="button" onClick={() => navigate("/projects")}>
                        {t("detail.backToList")}
                    </button>
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
            <button className="project-page__back-btn" type="button" onClick={() => navigate("/projects")}>
                {t("detail.back")}
            </button>

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
                        {project.myRole && project.myRole !== "VIEWER" && (
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

            <MembersBlock
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
