import { Button, Input, Select } from "@helpdesk-portal/ui-kit";
import PlusIcon from "@helpdesk-portal/icons/Plus.svg?react";
import SearchIcon from "@helpdesk-portal/icons/Search.svg?react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FC } from "react";
import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    type OnChangeFn,
    type PaginationState,
    type SortingState,
} from "@tanstack/react-table";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DataTable, DataTablePagination } from "@/shared/components/data-table";
import { formatDate } from "@/shared/lib/format-date";
import { useDynamicPerPage } from "@/shared/lib/use-dynamic-per-page";

import { createUser, deleteUser, fetchUsers, updateUser } from "../api/users";
import type { CreateUserData, FetchUsersParams, UpdateUserData, User } from "../model/users";

import "./UsersPage.css";

const ROLE_OPTIONS = [
    { value: "GUEST", label: "Гость" },
    { value: "USER", label: "Пользователь" },
    { value: "ADMIN", label: "Администратор" },
];

const columnHelper = createColumnHelper<User>();

export const UsersPage: FC = () => {
    const queryClient = useQueryClient();
    const [paginationState, setPaginationState] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [searchInput, setSearchInput] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [creating, setCreating] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { perPage, ready } = useDynamicPerPage(containerRef, {
        rowHeight: 57,
        theadHeight: 41,
        paginationHeight: 36,
        min: 5,
    });

    const pagination = useMemo<PaginationState>(() => {
        if (perPage === paginationState.pageSize) return paginationState;
        const oldOffset = paginationState.pageIndex * paginationState.pageSize;
        const newPageIndex = Math.floor(oldOffset / perPage);
        return { pageIndex: newPageIndex, pageSize: perPage };
    }, [paginationState, perPage]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQ(searchInput), 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setPaginationState(prev => ({ ...prev, pageIndex: 0 }));
    }, [debouncedQ]);

    const sortBy = sorting[0]?.id;
    const sortOrder: "asc" | "desc" | undefined = sorting[0]?.desc ? "desc" : sorting[0] ? "asc" : undefined;
    const page = pagination.pageIndex + 1;

    const userParams = {
        ...(debouncedQ ? { q: debouncedQ } : {}),
        page,
        perPage,
        ...(sortBy ? { sortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
    } satisfies FetchUsersParams;

    const { data, isPending, isError, error } = useQuery({
        queryKey: ["users", userParams],
        queryFn: () => fetchUsers(userParams),
        enabled: ready,
        placeholderData: keepPreviousData,
    });

    const users = data?.users ?? [];
    const total = data?.total ?? 0;

    const { mutateAsync: createUserMutate } = useMutation({
        mutationFn: (dto: CreateUserData) => createUser(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setCreating(false);
        },
    });

    const { mutate: deleteUserMutate } = useMutation({
        mutationFn: (id: number) => deleteUser(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    });

    const { mutate: updateRoleMutate } = useMutation({
        mutationFn: ({ id, role }: { id: number; role: User["role"] }) => updateUser(id, { role }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    });

    const { mutateAsync: editUserMutate } = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateUserData }) => updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setEditingUser(null);
        },
    });

    const handleSortingChange: OnChangeFn<SortingState> = updater => {
        setSorting(updater);
        setPaginationState(prev => ({ ...prev, pageIndex: 0 }));
    };

    const columns = [
        columnHelper.accessor("login", {
            header: "ЛОГИН",
            enableSorting: true,
        }),
        columnHelper.accessor("role", {
            header: "РОЛЬ",
            enableSorting: true,
            cell: info => (
                <Select
                    options={ROLE_OPTIONS}
                    value={info.getValue()}
                    onValueChange={value =>
                        updateRoleMutate({
                            id: info.row.original.id,
                            role: value as User["role"],
                        })
                    }
                />
            ),
        }),
        columnHelper.accessor("createdAt", {
            header: "СОЗДАН",
            enableSorting: true,
            cell: info => formatDate(info.getValue()),
        }),
        columnHelper.display({
            id: "actions",
            header: "",
            size: 200,
            minSize: 200,
            cell: info => (
                <div className="users-page__actions-cell">
                    <Button
                        variant="stroke"
                        size="s"
                        onClick={() => setEditingUser(info.row.original)}
                    >
                        Редактировать
                    </Button>
                    <Button
                        variant="stroke"
                        color="error"
                        size="s"
                        onClick={() => {
                            if (confirm(`Удалить пользователя «${info.row.original.login}»?`))
                                deleteUserMutate(info.row.original.id);
                        }}
                    >
                        Удалить
                    </Button>
                </div>
            ),
        }),
    ];

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: users,
        columns,
        state: { pagination, sorting },
        onPaginationChange: updater => {
            setPaginationState(prev => {
                const next = typeof updater === "function" ? updater(prev) : updater;
                return { pageIndex: next.pageIndex, pageSize: perPage };
            });
        },
        onSortingChange: handleSortingChange,
        manualPagination: true,
        pageCount: perPage > 0 ? Math.ceil(total / perPage) : -1,
        manualSorting: true,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="users-page">
            <div className="users-page__title-area">
                <div className="users-page__title-text">
                    <h1 className="users-page__title-heading">Пользователи</h1>
                    <p className="users-page__title-subtitle">Всего пользователей: {total}</p>
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
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                />
            </div>

            <div className="users-page__table-area" ref={containerRef}>
                {isPending && !data ? (
                    <p className="users-page__empty">Загрузка пользователей…</p>
                ) : isError && !data ? (
                    <p className="users-page__empty">{error instanceof Error ? error.message : "Ошибка загрузки"}</p>
                ) : (
                    <DataTable table={table}>
                        <DataTablePagination table={table} total={total} />
                    </DataTable>
                )}
            </div>

            {creating && (
                <div className="users-page__overlay">
                    <div className="users-page__modal">
                        <h2 className="users-page__modal-title">Создание пользователя</h2>
                        <CreateUserForm
                            onSubmit={data => createUserMutate(data).then(() => {})}
                            onCancel={() => setCreating(false)}
                        />
                    </div>
                </div>
            )}

            {editingUser && (
                <div className="users-page__overlay">
                    <div className="users-page__modal">
                        <h2 className="users-page__modal-title">Редактирование пользователя</h2>
                        <EditUserForm
                            user={editingUser}
                            onSubmit={data => editUserMutate({ id: editingUser.id, data }).then(() => {})}
                            onCancel={() => setEditingUser(null)}
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

const LOGIN_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLogin(value: string): string | undefined {
    if (!value.trim()) return "Введите email";
    if (!LOGIN_EMAIL_PATTERN.test(value.trim())) return "Некорректный формат email";
}

function validatePasswordCreate(value: string): string | undefined {
    if (!value) return "Введите пароль";
    if (value.length < 6) return "Пароль должен содержать не менее 6 символов";
}

const CreateUserForm: FC<CreateUserFormProps> = ({ onSubmit, onCancel }) => {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("GUEST");
    const [serverError, setServerError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const loginError = validateLogin(login);
    const passwordError = validatePasswordCreate(password);
    const hasFieldErrors = loginError !== undefined || passwordError !== undefined;
    const canSubmit = !submitting && !hasFieldErrors;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setServerError(null);
        setSubmitting(true);
        try {
            await onSubmit({ login: login.trim(), password, role: role as CreateUserData["role"] });
        } catch (err) {
            setServerError(err instanceof Error ? err.message : "Ошибка создания пользователя");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="users-page__form" onSubmit={handleSubmit} onChange={() => { if (serverError) setServerError(null); }}>
            {serverError ? (
                <div className="users-page__form-error">{serverError}</div>
            ) : null}
            <Input
                label="Логин"
                type="email"
                placeholder="Введите почту"
                value={login}
                onChange={e => setLogin(e.target.value)}
                color={loginError ? "error" : "default"}
                errorMessage={loginError}
                required
            />
            <div className="users-page__password-field">
                <Input
                    label="Пароль"
                    type={showPassword ? "text" : "password"}
                    placeholder="Минимум 6 символов"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    color={passwordError ? "error" : "default"}
                    errorMessage={passwordError}
                    required
                />
                <label className="users-page__checkbox-row">
                    <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={e => setShowPassword(e.target.checked)}
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
                <Button type="submit" disabled={!canSubmit}>
                    {submitting ? "Создание…" : "Создать"}
                </Button>
                <Button type="button" variant="stroke" onClick={onCancel}>
                    Отмена
                </Button>
            </div>
        </form>
    );
};

interface EditUserFormProps {
    user: User;
    onSubmit(data: UpdateUserData): Promise<void>;
    onCancel(): void;
}

const EditUserForm: FC<EditUserFormProps> = ({ user, onSubmit, onCancel }) => {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<string>(user.role);
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const loginError = login.trim() && !LOGIN_EMAIL_PATTERN.test(login.trim()) ? "Некорректный формат email" : undefined;
    const passwordError = password.length > 0 && password.length < 6 ? "Пароль должен содержать не менее 6 символов" : undefined;
    const hasFieldErrors = loginError !== undefined || passwordError !== undefined;
    const canSubmit = !submitting && !hasFieldErrors;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setServerError(null);
        setSubmitting(true);
        try {
            const data: UpdateUserData = {};
            if (login.trim()) data.login = login.trim();
            if (password) data.password = password;
            if (role !== user.role) data.role = role as User["role"];
            if (Object.keys(data).length === 0) {
                setServerError("Нет изменений для сохранения");
                setSubmitting(false);
                return;
            }
            await onSubmit(data);
        } catch (err) {
            setServerError(err instanceof Error ? err.message : "Ошибка обновления пользователя");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="users-page__form" onSubmit={handleSubmit} onChange={() => { if (serverError) setServerError(null); }}>
            {serverError ? (
                <div className="users-page__form-error">{serverError}</div>
            ) : null}

            <div className="users-page__old-data">
                <span className="users-page__old-data-label">Текущие данные</span>
                <div className="users-page__old-data-row">
                    <span className="users-page__old-data-key">Логин:</span>
                    <span className="users-page__old-data-value">{user.login}</span>
                </div>
                <div className="users-page__old-data-row">
                    <span className="users-page__old-data-key">Роль:</span>
                    <span className="users-page__old-data-value">
                        {ROLE_OPTIONS.find(o => o.value === user.role)?.label ?? user.role}
                    </span>
                </div>
            </div>

            <Input
                label="Новый логин"
                type="email"
                placeholder="Оставьте пустым, чтобы не менять"
                value={login}
                onChange={e => setLogin(e.target.value)}
                color={loginError ? "error" : "default"}
                errorMessage={loginError}
            />
            <div className="users-page__password-field">
                <Input
                    label="Новый пароль"
                    type={showPassword ? "text" : "password"}
                    placeholder="Оставьте пустым, чтобы не менять"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    color={passwordError ? "error" : "default"}
                    errorMessage={passwordError}
                />
                <label className="users-page__checkbox-row">
                    <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={e => setShowPassword(e.target.checked)}
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
                <Button type="submit" disabled={!canSubmit}>
                    {submitting ? "Сохранение…" : "Сохранить"}
                </Button>
                <Button type="button" variant="stroke" onClick={onCancel}>
                    Отмена
                </Button>
            </div>
        </form>
    );
};
