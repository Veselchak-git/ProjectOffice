/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { PROJECTS } from "@helpdesk-portal/i18n";
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

interface MembersBlockProps {
    projectId: number;
    globalRole: string | undefined;
    currentLogin: string | undefined;
    currentUserId: number | undefined;
    projectRole: ProjectMemberRole | undefined;
}

export const MembersBlock: FC<MembersBlockProps> = ({
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
        queryFn: () => fetchProjectMembers(projectId)
    });

    const { data: users = [], isPending: usersPending } = useQuery({
        queryKey: ["users", "all"],
        queryFn: fetchAllUsers,
        enabled: canManage
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

    const availableUsers = users.filter(u => !members.some(m => m.userId === u.id) && u.role !== "GUEST");
    const loading = membersPending || (canManage && usersPending);
    const error =
        actionError ?? (membersError ? (membersLoadError instanceof Error ? membersLoadError.message : null) : null);

    const handleAdd = async () => {
        if (selectedUserId === null) return;
        await addMember();
    };

    const handleRoleChange = async (userId: number, role: ProjectMemberRole) => {
        await updateMember({ userId, role });
    };

    const handleRemove = async (userId: number) => {
        const member = members.find(m => m.userId === userId);
        const name = member?.login ?? `#${userId}`;
        if (!window.confirm(t(`${projectId}:members.confirmDelete`, { name }))) return;
        await removeMember(userId);
    };

    return (
        <div className="members-block">
            <h2 className="members-block__title">{t(`${PROJECTS}:members.title`)}</h2>

            {error && <p className="members-block__error">{error}</p>}

            {loading ? (
                <p className="members-block__loading">{t(`${PROJECTS}:members.loading`)}</p>
            ) : (
                <>
                    <div className="members-block__list">
                        {members.length === 0 && (
                            <p className="members-block__empty">{t(`${PROJECTS}:members.empty`)}</p>
                        )}
                        {members.map(m => (
                            <div key={m.userId} className="members-block__item">
                                <span className="members-block__item-login">{m.login}</span>
                                {canManage && m.login !== currentLogin ? (
                                    <select
                                        className="members-block__item-role"
                                        value={m.role}
                                        onChange={e => handleRoleChange(m.userId, e.target.value as ProjectMemberRole)}
                                    >
                                        {assignableRoles.map(r => (
                                            <option key={r} value={r}>
                                                {roleLabels[r] ?? r}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="members-block__item-role-text">
                                        {roleLabels[m.role] ?? m.role}
                                    </span>
                                )}
                                {canManage && m.login !== currentLogin && (
                                    <button
                                        className="members-block__item-remove"
                                        type="button"
                                        onClick={() => handleRemove(m.userId)}
                                        title={t(`${PROJECTS}:members.deleteTooltip`)}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {canManage && availableUsers.length > 0 && (
                        <div className="members-block__add">
                            <select
                                className="members-block__add-user"
                                value={selectedUserId ?? ""}
                                onChange={e => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
                            >
                                <option value="">{t(`${PROJECTS}:members.placeholder`)}</option>
                                {availableUsers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.login}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="members-block__add-role"
                                value={selectedRole}
                                onChange={e => setSelectedRole(e.target.value as ProjectMemberRole)}
                            >
                                {assignableRoles.map(r => (
                                    <option key={r} value={r}>
                                        {roleLabels[r] ?? r}
                                    </option>
                                ))}
                            </select>
                            <button
                                className="members-block__add-btn"
                                type="button"
                                onClick={handleAdd}
                                disabled={selectedUserId === null}
                            >
                                {t(`${PROJECTS}:members.add`)}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
