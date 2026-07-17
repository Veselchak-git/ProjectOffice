/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
/*PROJECTS
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { COMMON, PROJECTS } from "@helpdesk-portal/i18n";
import { Button, Input, Select } from "@helpdesk-portal/ui-kit";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { CreateProjectData, ProjectVersion, UpdateProjectData } from "../model/project";
import "./ProjectForm.css";

interface ProjectFormProps {
    initial?: {
        name: string;
        description: string | null;
        status: "ACTIVE" | "ARCHIVED";
        versions: ProjectVersion[];
    };
    onSubmit(data: CreateProjectData | UpdateProjectData): Promise<void>;
    onCancel(): void;
}

export const ProjectForm: FC<ProjectFormProps> = ({ initial, onSubmit, onCancel }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(initial?.name ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED">(initial?.status ?? "ACTIVE");
    const [versions, setVersions] = useState<string[]>(initial?.versions.map(v => v.version) ?? []);
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
                label={t(`${PROJECTS}:form.name.label`)}
                placeholder={t(`${PROJECTS}:form.name.placeholder`)}
                value={name}
                onChange={e => setName(e.target.value)}
                required
            />

            <Input
                label={t(`${PROJECTS}:form.description.label`)}
                placeholder={t(`${PROJECTS}:form.description.placeholder`)}
                value={description}
                onChange={e => setDescription(e.target.value)}
            />

            <Select
                label={t(`${PROJECTS}:form.status.label`)}
                options={[
                    { value: "ACTIVE", label: t(`${PROJECTS}:status.active`) },
                    { value: "ARCHIVED", label: t(`${PROJECTS}:status.archived`) }
                ]}
                value={status}
                onValueChange={v => setStatus(v as "ACTIVE" | "ARCHIVED")}
            />

            <div className="project-form__field">
                <label className="project-form__label">{t(`${PROJECTS}:form.versions.label`)}</label>
                <div className="project-form__versions-input">
                    <Input
                        placeholder={t(`${PROJECTS}:form.versions.placeholder`)}
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
                                <Button
                                    type="button"
                                    className="project-form__tag-remove"
                                    onClick={() => removeVersion(v)}
                                >
                                    ×
                                </Button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="project-form__actions">
                <Button type="submit" disabled={!name.trim() || submitting}>
                    {initial ? t(`${COMMON}:save`) : t(`${COMMON}:create`)}
                </Button>
                <Button type="button" variant="stroke" onClick={onCancel}>
                    {t(`${COMMON}:cancel`)}
                </Button>
            </div>
        </form>
    );
};
