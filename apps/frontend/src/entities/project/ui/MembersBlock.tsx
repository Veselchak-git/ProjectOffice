import { useEffect, useReducer, useState } from "react";
import type { FC } from "react";

import type { Member, User } from "../model/project";
import {
    fetchUsers,
    fetchProjectMembers,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,
} from "../api/projects";

import "./MembersBlock.css";

const ROLES = ["VIEWER", "REPORTER", "UPDATER", "DEVELOPER", "MANAGER", "ADMINISTRATOR"];

const ROLE_LABELS: Record<string, string> = {
    VIEWER: "Наблюдатель",
    REPORTER: "Репортёр",
    UPDATER: "Редактор",
    DEVELOPER: "Разработчик",
    MANAGER: "Менеджер",
    ADMINISTRATOR: "Администратор",
};

interface MembersBlockProps {
    projectId: number;
}

interface MembersState {
    members: Member[];
    users: User[];
    loading: boolean;
    error: string | null;
}

type MembersAction =
    | { type: "start" }
    | { type: "loaded"; members: Member[]; users: User[] }
    | { type: "error"; message: string }
    | { type: "memberAdded"; member: Member }
    | { type: "memberUpdated"; member: Member }
    | { type: "memberRemoved"; userId: number };

const membersReducer = (state: MembersState, action: MembersAction): MembersState => {
    switch (action.type) {
        case "start":
            return { ...state, loading: true, error: null };
        case "loaded":
            return { members: action.members, users: action.users, loading: false, error: null };
        case "error":
            return { ...state, loading: false, error: action.message };
        case "memberAdded":
            return { ...state, members: [...state.members, action.member] };
        case "memberUpdated":
            return { ...state, members: state.members.map(m => (m.userId === action.member.userId ? action.member : m)) };
        case "memberRemoved":
            return { ...state, members: state.members.filter(m => m.userId !== action.userId) };
    }
};

export const MembersBlock: FC<MembersBlockProps> = ({ projectId }) => {
    const [{ members, users, loading, error }, dispatch] = useReducer(membersReducer, {
        members: [],
        users: [],
        loading: true,
        error: null,
    });
    const [selectedUserId, setSelectedUserId] = useState<number | "">("");
    const [selectedRole, setSelectedRole] = useState("VIEWER");

    useEffect(() => {
        dispatch({ type: "start" });
        let cancelled = false;
        Promise.all([
            fetchProjectMembers(projectId),
            fetchUsers(),
        ])
            .then(([membersData, usersData]) => {
                if (!cancelled) dispatch({ type: "loaded", members: membersData, users: usersData });
            })
            .catch(err => {
                if (!cancelled) dispatch({ type: "error", message: err.message });
            });
        return () => { cancelled = true; };
    }, [projectId]);

    const availableUsers = users.filter(
        u => !members.some(m => m.userId === u.id),
    );

    const handleAdd = async () => {
        if (selectedUserId === "") return;
        try {
            const member = await addProjectMember(projectId, Number(selectedUserId), selectedRole);
            dispatch({ type: "memberAdded", member });
            setSelectedUserId("");
            setSelectedRole("VIEWER");
        } catch (err: unknown) {
            dispatch({ type: "error", message: err instanceof Error ? err.message : "Ошибка добавления" });
        }
    };

    const handleRoleChange = async (userId: number, role: string) => {
        try {
            const member = await updateProjectMember(projectId, userId, role);
            dispatch({ type: "memberUpdated", member });
        } catch (err: unknown) {
            dispatch({ type: "error", message: err instanceof Error ? err.message : "Ошибка обновления" });
        }
    };

    const handleRemove = async (userId: number) => {
        try {
            await removeProjectMember(projectId, userId);
            dispatch({ type: "memberRemoved", userId });
        } catch (err: unknown) {
            dispatch({ type: "error", message: err instanceof Error ? err.message : "Ошибка удаления" });
        }
    };

    return (
        <div className="members-block">
            <h2 className="members-block__title">Участники проекта</h2>

            {error && <p className="members-block__error">{error}</p>}

            {loading ? (
                <p className="members-block__loading">Загрузка…</p>
            ) : (
                <>
                    <div className="members-block__list">
                        {members.length === 0 && (
                            <p className="members-block__empty">Нет участников</p>
                        )}
                        {members.map(m => (
                            <div key={m.userId} className="members-block__item">
                                <span className="members-block__item-login">{m.login}</span>
                                <select
                                    className="members-block__item-role"
                                    value={m.role}
                                    onChange={e => handleRoleChange(m.userId, e.target.value)}
                                >
                                    {ROLES.map(r => (
                                        <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
                                    ))}
                                </select>
                                <button
                                    className="members-block__item-remove"
                                    type="button"
                                    onClick={() => handleRemove(m.userId)}
                                    title="Удалить участника"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    {availableUsers.length > 0 && (
                        <div className="members-block__add">
                            <select
                                className="members-block__add-user"
                                value={selectedUserId}
                                onChange={e => setSelectedUserId(e.target.value ? Number(e.target.value) : "")}
                            >
                                <option value="">Выберите пользователя</option>
                                {availableUsers.map(u => (
                                    <option key={u.id} value={u.id}>{u.login}</option>
                                ))}
                            </select>
                            <select
                                className="members-block__add-role"
                                value={selectedRole}
                                onChange={e => setSelectedRole(e.target.value)}
                            >
                                {ROLES.map(r => (
                                    <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
                                ))}
                            </select>
                            <button
                                className="members-block__add-btn"
                                type="button"
                                onClick={handleAdd}
                                disabled={selectedUserId === ""}
                            >
                                Добавить
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
