import { Button, Input } from "@helpdesk-portal/ui-kit";
import type { FC } from "react";
import { useState } from "react";

import type { CreateProjectData, UpdateProjectData } from "../model/project";
import "./ProjectForm.css";

interface ProjectFormProps {
    initial?: {
        name: string;
        description: string | null;
        status: "ACTIVE" | "ARCHIVED";
        versions: string[];
    };
    onSubmit(data: CreateProjectData | UpdateProjectData): Promise<void>;
    onCancel(): void;
}

export const ProjectForm: FC<ProjectFormProps> = ({ initial, onSubmit, onCancel }) => {
    const [name, setName] = useState(initial?.name ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED">(initial?.status ?? "ACTIVE");
    const [versions, setVersions] = useState<string[]>(initial?.versions ?? []);
    const [versionInput, setVersionInput] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const addVersion = () => {
        const v = versionInput.trim();
        if (v && !versions.includes(v)) {
            setVersions(prev => [...prev, v]);
        }
        setVersionInput("");
    };

    const removeVersion = (v: string) => {
        setVersions(prev => prev.filter(x => x !== v));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            const data: Record<string, unknown> = {
                name,
                versions
            };
            if (description) data.description = description;
            if (initial) data.status = status;
            await onSubmit(data as CreateProjectData | UpdateProjectData);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="project-form" onSubmit={handleSubmit}>
            <Input
                label="Название проекта"
                placeholder="Введите название"
                value={name}
                onChange={e => setName(e.target.value)}
                required
            />

            <Input
                label="Описание"
                placeholder="Введите описание"
                value={description}
                onChange={e => setDescription(e.target.value)}
            />

            <div className="project-form__field">
                <label className="project-form__label">Статус</label>
                <select
                    className="project-form__select"
                    value={status}
                    onChange={e => setStatus(e.target.value as "ACTIVE" | "ARCHIVED")}
                >
                    <option value="ACTIVE">Активный</option>
                    <option value="ARCHIVED">Архивный</option>
                </select>
            </div>

            <div className="project-form__field">
                <label className="project-form__label">Версии продукта</label>
                <div className="project-form__versions-input">
                    <Input
                        placeholder="Введите версию и нажмите Enter"
                        value={versionInput}
                        onChange={e => setVersionInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addVersion();
                            }
                        }}
                    />
                    <Button type="button" disabled={!versionInput.trim()} onClick={addVersion}>
                        +
                    </Button>
                </div>
                {versions.length > 0 && (
                    <div className="project-form__tags">
                        {versions.map(v => (
                            <span key={v} className="project-form__tag">
                                {v}
                                <button
                                    type="button"
                                    className="project-form__tag-remove"
                                    onClick={() => removeVersion(v)}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="project-form__actions">
                <Button type="submit" disabled={!name.trim() || submitting}>
                    {initial ? "Сохранить" : "Создать"}
                </Button>
                <Button type="button" variant="stroke" onClick={onCancel}>
                    Отмена
                </Button>
            </div>
        </form>
    );
};
