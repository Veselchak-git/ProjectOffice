import { useEffect, useState } from "react";
import type { FC } from "react";
import { useNavigate, useParams } from "react-router";

import type { Project } from "@/entities/project";
import { fetchProjects } from "@/entities/project";

import "./ProjectPage.css";

export const ProjectPage: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        fetchProjects()
            .then(data => {
                const found = data.projects.find(p => p.id === Number(id));
                setProject(found ?? null);
            })
            .catch(err => setFetchError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

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
                    <button className="project-page__edit-btn" type="button">
                        Редактировать
                    </button>
                </div>

                <div className="project-page__fields">
                    <div className="project-page__field">
                        <span className="project-page__field-label">Описание</span>
                        <span className="project-page__field-value">{project.description || "—"}</span>
                    </div>
                    <div className="project-page__field">
                        <span className="project-page__field-label">Версии продукта</span>
                        <span className="project-page__field-value">{project.versionCount}</span>
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
                        <span className="project-page__field-value">{project.createdAt}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
