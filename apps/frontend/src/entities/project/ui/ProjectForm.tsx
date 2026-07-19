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
import { Controller, useForm } from "react-hook-form";
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

interface FormValues {
    name: string;
    description: string;
    status: "ACTIVE" | "ARCHIVED";
}

export const ProjectForm: FC<ProjectFormProps> = ({ initial, onSubmit, onCancel }) => {
    const { t } = useTranslation();
    const [versions, setVersions] = useState<string[]>(initial?.versions.map(v => v.version) ?? []);
    const [versionInput, setVersionInput] = useState("");

    const {
        control,
        handleSubmit,
        watch,
        formState: { isSubmitting }
    } = useForm<FormValues>({
        mode: "onChange",
        defaultValues: {
            name: initial?.name ?? "",
            description: initial?.description ?? "",
            status: initial?.status ?? "ACTIVE"
        }
    });

    const nameValue = watch("name");

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

    const onSubmitHandler = async (data: FormValues) => {
        const payload: Record<string, unknown> = {
            name: data.name,
            versions
        };
        if (data.description) payload.description = data.description;
        if (initial) payload.status = data.status;
        await onSubmit(payload as CreateProjectData | UpdateProjectData);
    };

    return (
        <form className="project-form" onSubmit={handleSubmit(onSubmitHandler)} noValidate>
            <Controller
                name="name"
                control={control}
                render={({ field }) => (
                    <Input
                        {...field}
                        label={t(`${PROJECTS}:form.name.label`)}
                        placeholder={t(`${PROJECTS}:form.name.placeholder`)}
                        required
                    />
                )}
            />

            <Controller
                name="description"
                control={control}
                render={({ field }) => (
                    <Input
                        {...field}
                        label={t(`${PROJECTS}:form.description.label`)}
                        placeholder={t(`${PROJECTS}:form.description.placeholder`)}
                    />
                )}
            />

            <Controller
                name="status"
                control={control}
                render={({ field }) => (
                    <Select
                        label={t(`${PROJECTS}:form.status.label`)}
                        options={[
                            { value: "ACTIVE", label: t(`${PROJECTS}:status.active`) },
                            { value: "ARCHIVED", label: t(`${PROJECTS}:status.archived`) }
                        ]}
                        value={field.value}
                        onValueChange={field.onChange}
                    />
                )}
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
                <Button type="submit" disabled={!nameValue.trim() || isSubmitting}>
                    {initial ? t(`${COMMON}:save`) : t(`${COMMON}:create`)}
                </Button>
                <Button type="button" variant="stroke" onClick={onCancel}>
                    {t(`${COMMON}:cancel`)}
                </Button>
            </div>
        </form>
    );
};
