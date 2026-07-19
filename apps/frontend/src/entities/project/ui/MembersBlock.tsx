/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { PROJECTS } from "@helpdesk-portal/i18n";
import { Button, Select } from "@helpdesk-portal/ui-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { fetchAllUsers } from "@/entities/user";

import { addProjectMember, fetchProjectMembers, removeProjectMember, updateProjectMember } from "../api/projects";
import type { ProjectMemberRole } from "../model/project";
import "./MembersBlock.css";

const ROLE_HIERARCHY: Record<ProjectMemberRole, number> = {
    VIEWER: 0,
    REPORTER: 1,
    UPDATER: 2,
    DEVELOPER: 3,
    MANAGER: 4
};

const ROLES: ProjectMemberRole[] = ["VIEWER", "REPORTER", "UPDATER", "DEVELOPER", "MANAGER"];

interface MembersListModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number;
    globalRole: string | undefined;
    currentLogin: string | undefined;
    currentUserId: number | undefined;
    projectRole: ProjectMemberRole | undefined;
}

export const MembersListModal: FC<MembersListModalProps> = ({
    isOpen,
    onClose,
    projectId,
    globalRole,
    currentLogin,
    currentUserId,
    projectRole
}) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [actionError, setActionError] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedRole, setSelectedRole] = useState<ProjectMemberRole>("VIEWER");

    const roleLabels: Record<ProjectMemberRole, string> = {
        VIEWER: t(`${PROJECTS}:members.roles.viewer`),
        REPORTER: t(`${PROJECTS}:members.roles.reporter`),
        UPDATER: t(`${PROJECTS}:members.roles.updater`),
        DEVELOPER: t(`${PROJECTS}:members.roles.developer`),
        MANAGER: t(`${PROJECTS}:members.roles.manager`)
    };

    const canManage = globalRole === "ADMIN" || projectRole === "MANAGER";
    const maxAssignableRank = globalRole === "ADMIN" ? 4 : (ROLE_HIERARCHY[projectRole ?? "VIEWER"] ?? 0);
    const assignableRoles = ROLES.filter(r => (ROLE_HIERARCHY[r] ?? 0) <= maxAssignableRank);

    const {
        data: members = [],
        isPending: membersPending,
        isError: membersError,
        error: membersLoadError
    } = useQuery({
        queryKey: ["project-members", projectId],
        queryFn: () => fetchProjectMembers(projectId),
        enabled: isOpen
    });

    const { data: users = [], isPending: usersPending } = useQuery({
        queryKey: ["users", "all"],
        queryFn: fetchAllUsers,
        enabled: isOpen && canManage
    });

    const toActionError = (err: unknown, fallbackKey: string): string => {
        const apiError = err as Error & { code?: string };
        if (apiError.code) {
            return t(`${projectId}:error.${apiError.code}`, { defaultValue: apiError.message });
        }
        if (err instanceof Error) return err.message;
        return t(fallbackKey);
    };

    const invalidateMembers = () => {
        queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
        queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    };

    const { mutateAsync: updateMember } = useMutation({
        mutationFn: ({ userId, role }: { userId: number; role: ProjectMemberRole }) =>
            updateProjectMember(projectId, userId, role),
        onSuccess: (_data, variables) => {
            invalidateMembers();
            setActionError(null);
            if (variables.userId === currentUserId) {
                queryClient.invalidateQueries({ queryKey: ["audit-log-available"] });
                queryClient.invalidateQueries({ queryKey: ["project", projectId] });
            }
        },
        onError: err => {
            setActionError(toActionError(err, `${projectId}:members.error.update`));
        }
    });

    const { mutateAsync: removeMember } = useMutation({
        mutationFn: (userId: number) => removeProjectMember(projectId, userId),
        onSuccess: (_data, userId) => {
            invalidateMembers();
            setActionError(null);
            if (userId === currentUserId) {
                queryClient.invalidateQueries({ queryKey: ["audit-log-available"] });
                queryClient.invalidateQueries({ queryKey: ["project", projectId] });
            }
        },
        onError: err => {
            setActionError(toActionError(err, `${projectId}:members.error.delete`));
        }
    });

    const { mutateAsync: addMember } = useMutation({
        mutationFn: () => addProjectMember(projectId, selectedUserId!, selectedRole),
        onSuccess: () => {
            invalidateMembers();
            setSelectedUserId(null);
            setSelectedRole("VIEWER");
            setActionError(null);
        },
        onError: err => {
            setActionError(toActionError(err, `${projectId}:members.error.add`));
        }
    });

    const availableUsers = users.filter(u => !members.some(m => m.userId === u.id));
    const loading = membersPending || (isOpen && canManage && usersPending);
    const error =
        actionError ?? (membersError ? (membersLoadError instanceof Error ? membersLoadError.message : null) : null);

    const handleRoleChange = async (userId: number, role: ProjectMemberRole) => {
        await updateMember({ userId, role });
    };

    const handleRemove = async (userId: number) => {
        const member = members.find(m => m.userId === userId);
        const name = member?.login ?? `#${userId}`;
        if (!window.confirm(t(`${projectId}:members.confirmDelete`, { name }))) return;
        await removeMember(userId);
    };

    const handleLeave = async () => {
        if (!window.confirm(t(`${PROJECTS}:members.confirmLeave`))) return;
        await removeMember(currentUserId!);
    };

    const handleAdd = async () => {
        if (selectedUserId === null) return;
        await addMember();
    };

    if (!isOpen) return null;

    return (
        <div className="members-block-modal__overlay" onClick={onClose}>
            <div className="members-block-modal__content" onClick={e => e.stopPropagation()}>
                <div className="members-block-modal__header">
                    <h2 className="members-block-modal__title">{t(`${PROJECTS}:members.title`)}</h2>
                    <Button className="members-block-modal__close" type="button" onClick={onClose}>
                        ✕
                    </Button>
                </div>

                {error && <p className="members-block__error">{error}</p>}

                {loading ? (
                    <p className="members-block__loading">{t(`${PROJECTS}:members.loading`)}</p>
                ) : (
                    <>
                        {canManage && availableUsers.length > 0 && (
                            <div className="members-block__add">
                                <div className="members-block__add-user">
                                    <Select
                                        options={[
                                            { value: "", label: t(`${PROJECTS}:members.placeholder`) },
                                            ...availableUsers.map(u => ({ value: String(u.id), label: u.login }))
                                        ]}
                                        value={selectedUserId != null ? String(selectedUserId) : ""}
                                        onValueChange={v => setSelectedUserId(v ? Number(v) : null)}
                                        inputSize="s"
                                        usePortal={false}
                                    />
                                </div>
                                <div className="members-block__add-role">
                                    <Select
                                        options={assignableRoles.map(r => ({ value: r, label: roleLabels[r] ?? r }))}
                                        value={selectedRole}
                                        onValueChange={v => setSelectedRole(v as ProjectMemberRole)}
                                        inputSize="s"
                                        usePortal={false}
                                    />
                                </div>
                                <Button
                                    className="members-block__add-btn"
                                    type="button"
                                    onClick={handleAdd}
                                    disabled={selectedUserId === null}
                                >
                                    {t(`${PROJECTS}:members.add`)}
                                </Button>
                            </div>
                        )}
                        <div className="members-block__list">
                            {members.length === 0 && (
                                <p className="members-block__empty">{t(`${PROJECTS}:members.empty`)}</p>
                            )}
                            {members.map(m => (
                                <div key={m.userId} className="members-block__item">
                                    <span className="members-block__item-login">{m.login}</span>
                                    {canManage && m.login !== currentLogin ? (
                                        <div className="members-block__item-role">
                                            <Select
                                                options={assignableRoles.map(r => ({
                                                    value: r,
                                                    label: roleLabels[r] ?? r
                                                }))}
                                                value={m.role}
                                                onValueChange={v => handleRoleChange(m.userId, v as ProjectMemberRole)}
                                                inputSize="s"
                                                usePortal={false}
                                            />
                                        </div>
                                    ) : (
                                        <span className="members-block__item-role-text">
                                            {roleLabels[m.role] ?? m.role}
                                        </span>
                                    )}
                                    {canManage && m.login !== currentLogin && (
                                        <Button
                                            className="members-block__item-remove"
                                            type="button"
                                            onClick={() => handleRemove(m.userId)}
                                            title={t(`${PROJECTS}:members.deleteTooltip`)}
                                        >
                                            ✕
                                        </Button>
                                    )}
                                    {m.userId === currentUserId && (
                                        <Button
                                            className="members-block__item-remove"
                                            type="button"
                                            onClick={handleLeave}
                                        >
                                            ✕
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
