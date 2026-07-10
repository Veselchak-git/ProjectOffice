import { Button, Checkbox, Input, Select } from "@helpdesk-portal/ui-kit";
import PlusIcon from "@helpdesk-portal/icons/Plus.svg?react";
import SearchIcon from "@helpdesk-portal/icons/Search.svg?react";
import SortAscendingIcon from "@helpdesk-portal/icons/SortAscending.svg?react";
import { useEffect, useState } from "react";
import type { FC } from "react";

import { formatDate } from "@/shared/lib/format-date/format-date";

import { createUser, deleteUser, fetchUsers, updateUserRole } from "../api/users";
import type { CreateUserData, User } from "../model/users";

import "./UsersPage.css";

type SortKey = "login" | "role" | "createdAt";

const ROLE_ORDER: Record<string, number> = {
    GUEST: 0,
    PROJECT_MANAGER: 1,
    ADMIN: 2,
};

const ROLE_OPTIONS = [
    { value: "GUEST", label: "Гость" },
    { value: "PROJECT_MANAGER", label: "Проджект Менеджер" },
    { value: "ADMIN", label: "Администратор" },
];

export const UsersPage: FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState<Record<number, boolean>>({});

    useEffect(() => {
        fetchUsers()
            .then(data => { setUsers(data); setFetchError(null); })
            .catch(err => setFetchError(err instanceof Error ? err.message : "Ошибка загрузки"))
            .finally(() => setLoading(false));
    }, []);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const searched = searchQuery.trim()
        ? users.filter(u => u.login.toLowerCase().includes(searchQuery.toLowerCase().trim()))
        : users;

    const sorted = sortKey
        ? [...searched].sort((a, b) => {
              let cmp: number;
              if (sortKey === "role") {
                  cmp = (ROLE_ORDER[a.role] ?? 0) - (ROLE_ORDER[b.role] ?? 0);
              } else {
                  cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
              }
              return sortDir === "asc" ? cmp : -cmp;
          })
        : searched;

    const handleCreate = async (data: CreateUserData) => {
        const created = await createUser(data);
        setUsers(prev => [...prev, created]);
        setCreating(false);
        setFetchError(null);
    };

    const handleRoleChange = async (userId: number, newRole: string) => {
        setUpdating(prev => ({ ...prev, [userId]: true }));
        try {
            const updated = await updateUserRole(userId, { role: newRole as User["role"] });
            setUsers(prev => prev.map(u => (u.id === userId ? { ...updated, createdAt: u.createdAt } : u)));
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Ошибка";
            alert(msg);
        } finally {
            setUpdating(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleDelete = async (userId: number, login: string) => {
        if (!confirm(`Удалить пользователя «${login}»?`)) return;
        try {
            await deleteUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Ошибка удаления";
            alert(msg);
        }
    };

    if (loading) {
        return <div className="users-page"><p className="users-page__empty">Загрузка пользователей…</p></div>;
    }

    if (fetchError && users.length === 0) {
        return <div className="users-page"><p className="users-page__empty">{fetchError}</p></div>;
    }

    return (
        <div className="users-page">
            <div className="users-page__title-area">
                <div className="users-page__title-text">
                    <h1 className="users-page__title-heading">Пользователи</h1>
                    <p className="users-page__title-subtitle">Всего пользователей: {users.length}</p>
                </div>
                <div className="users-page__actions">
                    <button className="users-page__create-btn" type="button" onClick={() => setCreating(true)}>
                        <PlusIcon />
                        Создать пользователя
                    </button>
                </div>
            </div>

            <div className="users-page__controls">
                <Input
                    className="users-page__controls-search"
                    placeholder="Найти пользователя..."
                    startIcon={<SearchIcon />}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="users-table-wrapper">
                <table className="users-table">
                    <thead>
                        <tr>
                            <SortableTh
                                className="users-table__login"
                                sortKey="login"
                                currentKey={sortKey}
                                dir={sortDir}
                                onClick={handleSort}
                            >
                                ЛОГИН
                            </SortableTh>
                            <SortableTh
                                className="users-table__role"
                                sortKey="role"
                                currentKey={sortKey}
                                dir={sortDir}
                                onClick={handleSort}
                            >
                                РОЛЬ
                            </SortableTh>
                            <SortableTh
                                className="users-table__created"
                                sortKey="createdAt"
                                currentKey={sortKey}
                                dir={sortDir}
                                onClick={handleSort}
                            >
                                СОЗДАН
                            </SortableTh>
                            <th className="users-table__actions"> </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="users-table__empty">
                                    {searchQuery.trim()
                                        ? "Пользователи по вашему запросу не найдены"
                                        : "Пользователи не найдены"}
                                </td>
                            </tr>
                        ) : (
                            sorted.map(user => (
                                <tr key={user.id}>
                                    <td className="users-table__login">{user.login}</td>
                                    <td className="users-table__role">
                                        <div className="users-table__role-cell">
                                            {updating[user.id] ? (
                                                <span className="users-table__role-saving">Сохранение…</span>
                                            ) : (
                                                <Select
                                                    options={ROLE_OPTIONS}
                                                    value={user.role}
                                                    onValueChange={value => handleRoleChange(user.id, value)}
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="users-table__created">{formatDate(user.createdAt)}</td>
                                    <td className="users-table__actions">
                                        <Button
                                            variant="stroke"
                                            color="error"
                                            size="s"
                                            onClick={() => handleDelete(user.id, user.login)}
                                        >
                                            Удалить
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {creating && (
                <div className="users-page__overlay">
                    <div className="users-page__modal">
                        <h2 className="users-page__modal-title">Создание пользователя</h2>
                        <CreateUserForm
                            onSubmit={handleCreate}
                            onCancel={() => setCreating(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

interface CreateUserFormProps {
    onSubmit(data: CreateUserData): Promise<void>;
    onCancel(): void;
}

const CreateUserForm: FC<CreateUserFormProps> = ({ onSubmit, onCancel }) => {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("GUEST");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setError(null);
        if (!login.trim()) { setError("Введите логин"); return; }
        if (password.length < 6) { setError("Пароль должен содержать не менее 6 символов"); return; }
        setSubmitting(true);
        try {
            await onSubmit({ login: login.trim(), password, role: role as CreateUserData["role"] });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка создания пользователя");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="users-page__form" onSubmit={handleSubmit}>
            {error && <div className="users-page__form-error">{error}</div>}
            <Input
                label="Логин"
                placeholder="Введите логин"
                value={login}
                onChange={e => setLogin(e.target.value)}
                required
            />
            <div className="users-page__password-field">
                <Input
                    label="Пароль"
                    type={showPassword ? "text" : "password"}
                    placeholder="Минимум 6 символов"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                <label className="users-page__checkbox-row">
                    <Checkbox
                        inputSize="m"
                        checked={showPassword}
                        onCheckedChange={setShowPassword}
                    />
                    <span>Показать пароль</span>
                </label>
            </div>
            <Select
                label="Роль"
                options={ROLE_OPTIONS}
                value={role}
                usePortal={false}
                onValueChange={setRole}
            />
            <div className="users-page__form-actions">
                <Button type="submit" disabled={!login.trim() || password.length < 6 || submitting}>
                    {submitting ? "Создание…" : "Создать"}
                </Button>
                <Button type="button" variant="stroke" onClick={onCancel}>
                    Отмена
                </Button>
            </div>
        </form>
    );
};

interface SortableThProps {
    className: string;
    sortKey: SortKey;
    currentKey: SortKey | null;
    dir: "asc" | "desc";
    onClick: (key: SortKey) => void;
    children: string;
}

const SortableTh: FC<SortableThProps> = ({ className, sortKey, currentKey, dir, onClick, children }) => {
    const isActive = currentKey === sortKey;

    return (
        <th
            className={`${className} users-table__header--sortable${isActive ? " users-table__header--sorted" : ""}`}
            onClick={() => onClick(sortKey)}
        >
            {children}
            <span className={`users-table__sort-icon${isActive ? ` users-table__sort-icon--${dir}` : ""}`}>
                <SortAscendingIcon />
            </span>
        </th>
    );
};
