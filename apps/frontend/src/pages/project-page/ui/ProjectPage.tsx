import { useEffect, useReducer, useState } from "react";
import type { FC } from "react";
import { useNavigate, useParams } from "react-router";

import { formatDateTime } from "@/shared/lib/format-date/format-date";

import type { Project, UpdateProjectData } from "@/entities/project";
import { fetchProject, updateProject, deleteProject } from "@/entities/project";
import { ProjectForm } from "@/entities/project/ui/ProjectForm";
import { MembersBlock } from "@/entities/project/ui/MembersBlock";
import { useAuth } from "@/shared/lib/auth/auth-context";

import "./ProjectPage.css";

interface ProjectPageState {
    project: Project | null;
    loading: boolean;
    fetchError: string | null;
}

type ProjectPageAction =
    | { type: "start" }
    | { type: "success"; project: Project }
    | { type: "error"; message: string };

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
    const { user } = useAuth();
    const [{ project, loading, fetchError }, dispatch] = useReducer(projectReducer, {
        project: null,
        loading: true,
        fetchError: null,
    });
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);

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
        return () => { cancelled = true; };
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
        if (!window.confirm("Вы уверены, что хотите удалить проект? Это действие необратимо.")) return;
        setDeleting(true);
        try {
            await deleteProject(Number(id));
            navigate("/projects", { replace: true });
        } catch {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="project-page">
                <p className="project-page__loading">Загрузка проекта…</p>
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
                    <h1>Проект не найден</h1>
                    <button className="project-page__back-btn" type="button" onClick={() => navigate("/projects")}>
                        Вернуться к списку
                    </button>
                </div>
            </div>
        );
    }

    if (editing) {
        return (
            <div className="project-page">
                <h1 className="project-form-title">Редактирование проекта</h1>
                <ProjectForm
                    initial={{
                        name: project.name,
                        description: project.description,
                        status: project.status,
                        versions: project.versions,
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
                ← Назад к проектам
            </button>

            <div className="project-page__card">
                <div className="project-page__header">
                    <div className="project-page__title-area">
                        <h1 className="project-page__title">{project.name}</h1>
                        <span className={`project-page__status project-page__status--${project.status === "ACTIVE" ? "active" : "archived"}`}>
                            {project.status === "ACTIVE" ? "Активный" : "Архивный"}
                        </span>
                    </div>
                    <div className="project-page__actions">
                        {(user?.role === "PROJECT_MANAGER" || user?.role === "ADMIN" || project.myRole === "MANAGER" || project.myRole === "ADMINISTRATOR") && (
                            <button className="project-page__edit-btn" type="button" onClick={() => setEditing(true)}>
                                Редактировать
                            </button>
                        )}
                        {(user?.role === "ADMIN" || project.myRole === "ADMINISTRATOR") && (
                            <button
                                className="project-page__delete-btn"
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? "Удаление…" : "Удалить"}
                            </button>
                        )}
                    </div>
                </div>

                <div className="project-page__fields">
                    <div className="project-page__field">
                        <span className="project-page__field-label">Описание</span>
                        <span className="project-page__field-value">{project.description || "—"}</span>
                    </div>
                    <div className="project-page__field">
                        <span className="project-page__field-label">Версии продукта</span>
                        <div className="project-page__versions-list">
                            {project.versions.length > 0
                                ? project.versions.map(v => (
                                      <span key={v} className="project-page__version-tag">{v}</span>
                                  ))
                                : <span className="project-page__field-value">—</span>
                            }
                        </div>
                    </div>
                    <div className="project-page__field">
                        <span className="project-page__field-label">Задачи</span>
                        <span className="project-page__field-value">{project.taskCount}</span>
                    </div>
                    <div className="project-page__field">
                        <span className="project-page__field-label">Ответственный</span>
                        <span className="project-page__field-value">{project.responsible}</span>
                    </div>
                    <div className="project-page__field">
                        <span className="project-page__field-label">Дата создания</span>
                        <span className="project-page__field-value">{formatDateTime(project.createdAt)}</span>
                    </div>
                </div>
            </div>

            <MembersBlock projectId={project.id} globalRole={user?.role} currentLogin={user?.login} projectRole={project.myRole} />
        </div>
    );
};
