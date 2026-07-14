import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NS } from "@helpdesk-portal/i18n";
import GearIcon from "@helpdesk-portal/icons/GearIcon.svg?react";
import PlusIcon from "@helpdesk-portal/icons/Plus.svg?react";
import SearchIcon from "@helpdesk-portal/icons/Search.svg?react";
import { Button, Checkbox, Input, Select } from "@helpdesk-portal/ui-kit";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef, type SortingState, createColumnHelper } from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { createUser, deleteUser, fetchUsers, updateUser } from "@/entities/user";
import type { CreateUserData, FetchUsersParams, UpdateUserData, User } from "@/entities/user";

import { formatDate } from "@/shared/lib/format-date";
import { i18n } from "@/shared/lib/i18n";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { useDynamicPerPage } from "@/shared/lib/use-dynamic-per-page";
import { useTable } from "@/shared/lib/use-table";

import { DataTable } from "@/shared/ui/data-table";

import { ALL_COLUMNS } from "../model/columns";
import {
    selectColumnOrder,
    selectColumnVisibility,
    setColumnOrder,
    setColumnVisibility
} from "../model/users-page-slice";
import "./UsersPage.css";

const getRoleOptions = (t: (key: string) => string) => [
    { value: "GUEST" as const, label: t("roles.guest") },
    { value: "USER" as const, label: t("roles.user") },
    { value: "ADMIN" as const, label: t("roles.admin") }
];

const columnHelper = createColumnHelper<User>();

export const UsersPage: FC = () => {
    const { t } = useTranslation(NS.users);
    const queryClient = useQueryClient();
    const [pageIndex, setPageIndex] = useState(0);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [searchInput, setSearchInput] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [creating, setCreating] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const dispatch = useAppDispatch();
    const columnVisibility = useAppSelector(selectColumnVisibility);
    const columnOrder = useAppSelector(selectColumnOrder);
    const [columnsOpen, setColumnsOpen] = useState(false);
    const columnsRef = useRef<HTMLDivElement>(null);

    const { perPage, ready } = useDynamicPerPage(containerRef, {
        rowHeight: 57,
        theadHeight: 41,
        paginationHeight: 36,
        min: 5
    });

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
                setColumnsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            setDebouncedQ(value);
            setPageIndex(0);
        }, 400);
    };

    const sortBy = sorting[0]?.id;
    const sortOrder: "asc" | "desc" | undefined = sorting[0]?.desc ? "desc" : sorting[0] ? "asc" : undefined;
    const page = pageIndex + 1;

    const userParams = {
        ...(debouncedQ ? { q: debouncedQ } : {}),
        page,
        perPage,
        ...(sortBy ? { sortBy } : {}),
        ...(sortOrder ? { sortOrder } : {})
    } satisfies FetchUsersParams;

    const { data, isPending, isError, error } = useQuery({
        queryKey: ["users", userParams],
        queryFn: () => fetchUsers(userParams),
        enabled: ready,
        placeholderData: keepPreviousData
    });

    const users = data?.users ?? [];
    const total = data?.total ?? 0;

    const { mutateAsync: createUserMutate } = useMutation({
        mutationFn: (dto: CreateUserData) => createUser(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setCreating(false);
        }
    });

    const { mutate: deleteUserMutate } = useMutation({
        mutationFn: (id: number) => deleteUser(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
    });

    const { mutate: updateRoleMutate } = useMutation({
        mutationFn: ({ id, role }: { id: number; role: User["role"] }) => updateUser(id, { role }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
    });

    const { mutateAsync: editUserMutate } = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateUserData }) => updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setEditingUser(null);
        }
    });

    const columns = [
        columnHelper.accessor("login", {
            header: t("table.login"),
            enableSorting: true
        }),
        columnHelper.accessor("role", {
            header: t("table.role"),
            enableSorting: true,
            cell: info => (
                <Select
                    options={getRoleOptions(t)}
                    value={info.getValue()}
                    onValueChange={value =>
                        updateRoleMutate({
                            id: info.row.original.id,
                            role: value as User["role"]
                        })
                    }
                />
            )
        }),
        columnHelper.accessor("createdAt", {
            header: t("table.created"),
            enableSorting: true,
            cell: info => formatDate(info.getValue())
        }),
        columnHelper.display({
            id: "actions",
            header: "",
            size: 200,
            minSize: 200,
            cell: info => (
                <div className="users-page__actions-cell">
                    <Button variant="stroke" size="s" onClick={() => setEditingUser(info.row.original)}>
                        {t("table.edit")}
                    </Button>
                    <Button
                        variant="stroke"
                        color="error"
                        size="s"
                        onClick={() => {
                            if (confirm(t("delete.confirm", { login: info.row.original.login })))
                                deleteUserMutate(info.row.original.id);
                        }}
                    >
                        {t("delete.delete")}
                    </Button>
                </div>
            )
        })
    ];

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const prev = columnOrder;
        const oldIndex = prev.indexOf(String(active.id));
        const newIndex = prev.indexOf(String(over.id));
        if (oldIndex === -1 || newIndex === -1) return;

        const next = [...prev];
        next.splice(newIndex, 0, ...next.splice(oldIndex, 1));
        dispatch(setColumnOrder(next));
    }

    const { table } = useTable({
        data: users,
        columns: columns as ColumnDef<User>[],
        getRowId: row => String(row.id),
        total,
        pageSize: perPage,
        pageIndex,
        onPageIndexChange: setPageIndex,
        sorting,
        onSortingChange: setSorting,
        columnVisibility,
        columnOrder,
        onColumnOrderChange: updater => {
            const next = typeof updater === "function" ? updater(columnOrder) : updater;
            dispatch(setColumnOrder(next));
        },
        onColumnVisibilityChange: updater => {
            const next = typeof updater === "function" ? updater(columnVisibility) : updater;
            dispatch(setColumnVisibility(next));
        },
        resetKey: debouncedQ
    });

    return (
        <div className="users-page">
            <div className="users-page__title-area">
                <div className="users-page__title-text">
                    <h1 className="users-page__title-heading">{t("page.title")}</h1>
                    <p className="users-page__title-subtitle">{t("page.subtitle", { count: total })}</p>
                </div>
                <div className="users-page__actions">
                    <button className="users-page__create-btn" type="button" onClick={() => setCreating(true)}>
                        <PlusIcon />
                        {t("actions.create")}
                    </button>
                    <div className="users-page__columns-wrapper" ref={columnsRef}>
                        <button
                            className="users-page__columns-btn"
                            type="button"
                            onClick={() => setColumnsOpen(v => !v)}
                        >
                            <GearIcon />
                            {t("actions.columns")}
                        </button>
                        {columnsOpen && (
                            <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                                <SortableContext items={columnOrder} strategy={verticalListSortingStrategy}>
                                    <div className="users-page__columns-dropdown">
                                        {columnOrder
                                            .filter(id => id !== "select" && id !== "actions")
                                            .map(id => {
                                                const col = ALL_COLUMNS.find(c => c.id === id);
                                                if (!col) return null;
                                                return (
                                                    <SortableColumnItem
                                                        key={col.id}
                                                        id={col.id}
                                                        label={t(col.label)}
                                                        isVisible={table.getColumn(col.id)?.getIsVisible() ?? true}
                                                        onToggle={() => table.getColumn(col.id)?.toggleVisibility()}
                                                    />
                                                );
                                            })}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                </div>
            </div>

            <div className="users-page__controls">
                <Input
                    className="users-page__controls-search"
                    placeholder={t("search.placeholder")}
                    startIcon={<SearchIcon />}
                    value={searchInput}
                    onChange={e => handleSearchChange(e.target.value)}
                />
            </div>

            <div className="users-page__table-area" ref={containerRef}>
                {isPending && !data ? (
                    <p className="users-page__empty">{t("loading")}</p>
                ) : isError && !data ? (
                    <p className="users-page__empty">{error instanceof Error ? error.message : t("error.loading")}</p>
                ) : (
                    <DataTable table={table} total={total} />
                )}
            </div>

            {creating && (
                <div className="users-page__overlay">
                    <div className="users-page__modal">
                        <h2 className="users-page__modal-title">{t("create.title")}</h2>
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
                        <h2 className="users-page__modal-title">{t("edit.title")}</h2>
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
    if (!value.trim()) return i18n.t(`${NS.users}:validation.required.email`);
    if (!LOGIN_EMAIL_PATTERN.test(value.trim())) return i18n.t(`${NS.users}:validation.invalid.email`);
}

function validatePasswordCreate(value: string): string | undefined {
    if (!value) return i18n.t(`${NS.users}:validation.required.password`);
    if (value.length < 6) return i18n.t(`${NS.users}:validation.minLength.password`);
}

const CreateUserForm: FC<CreateUserFormProps> = ({ onSubmit, onCancel }) => {
    const { t: tu } = useTranslation(NS.users);
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
            setServerError(err instanceof Error ? err.message : i18n.t(`${NS.users}:create.error`));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            className="users-page__form"
            onSubmit={handleSubmit}
            onChange={() => {
                if (serverError) setServerError(null);
            }}
        >
            {serverError ? <div className="users-page__form-error">{serverError}</div> : null}
            <Input
                label={tu("form.login.label")}
                type="email"
                placeholder={tu("form.login.placeholder")}
                value={login}
                onChange={e => setLogin(e.target.value)}
                color={loginError ? "error" : "default"}
                errorMessage={loginError}
                required
            />
            <div className="users-page__password-field">
                <Input
                    label={tu("form.password.label")}
                    type={showPassword ? "text" : "password"}
                    placeholder={tu("form.password.placeholder")}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    color={passwordError ? "error" : "default"}
                    errorMessage={passwordError}
                    required
                />
                <label className="users-page__checkbox-row">
                    <input type="checkbox" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} />
                    <span>{tu("form.showPassword")}</span>
                </label>
            </div>
            <Select
                label={tu("form.role")}
                options={getRoleOptions(tu)}
                value={role}
                usePortal={false}
                onValueChange={setRole}
            />
            <div className="users-page__form-actions">
                <Button type="submit" disabled={!canSubmit}>
                    {submitting ? tu("create.submitting") : tu("create.submit")}
                </Button>
                <Button type="button" variant="stroke" onClick={onCancel}>
                    {tu(`${NS.common}:cancel`)}
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
    const { t: tu } = useTranslation(NS.users);
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<string>(user.role);
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const loginError =
        login.trim() && !LOGIN_EMAIL_PATTERN.test(login.trim())
            ? i18n.t(`${NS.users}:validation.invalid.email`)
            : undefined;
    const passwordError =
        password.length > 0 && password.length < 6 ? i18n.t(`${NS.users}:validation.minLength.password`) : undefined;
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
                setServerError(i18n.t(`${NS.users}:edit.noChanges`));
                setSubmitting(false);
                return;
            }
            await onSubmit(data);
        } catch (err) {
            setServerError(err instanceof Error ? err.message : i18n.t(`${NS.users}:edit.error`));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            className="users-page__form"
            onSubmit={handleSubmit}
            onChange={() => {
                if (serverError) setServerError(null);
            }}
        >
            {serverError ? <div className="users-page__form-error">{serverError}</div> : null}

            <div className="users-page__old-data">
                <span className="users-page__old-data-label">{tu("edit.currentData")}</span>
                <div className="users-page__old-data-row">
                    <span className="users-page__old-data-key">{tu("edit.loginLabel")}</span>
                    <span className="users-page__old-data-value">{user.login}</span>
                </div>
                <div className="users-page__old-data-row">
                    <span className="users-page__old-data-key">{tu("edit.roleLabel")}</span>
                    <span className="users-page__old-data-value">
                        {getRoleOptions(tu).find(o => o.value === user.role)?.label ?? user.role}
                    </span>
                </div>
            </div>

            <Input
                label={tu("edit.newLogin")}
                type="email"
                placeholder={tu("edit.newLoginPlaceholder")}
                value={login}
                onChange={e => setLogin(e.target.value)}
                color={loginError ? "error" : "default"}
                errorMessage={loginError}
            />
            <div className="users-page__password-field">
                <Input
                    label={tu("edit.newPassword")}
                    type={showPassword ? "text" : "password"}
                    placeholder={tu("edit.newPasswordPlaceholder")}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    color={passwordError ? "error" : "default"}
                    errorMessage={passwordError}
                />
                <label className="users-page__checkbox-row">
                    <input type="checkbox" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} />
                    <span>{tu("edit.showPassword")}</span>
                </label>
            </div>
            <Select
                label={tu("form.role")}
                options={getRoleOptions(tu)}
                value={role}
                usePortal={false}
                onValueChange={setRole}
            />
            <div className="users-page__form-actions">
                <Button type="submit" disabled={!canSubmit}>
                    {submitting ? tu("edit.saving") : tu("edit.save")}
                </Button>
                <Button type="button" variant="stroke" onClick={onCancel}>
                    {tu(`${NS.common}:cancel`)}
                </Button>
            </div>
        </form>
    );
};

const GripIcon: FC = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="4" r="1.5" />
        <circle cx="11" cy="4" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="11" cy="12" r="1.5" />
    </svg>
);

const SortableColumnItem: FC<{
    id: string;
    label: string;
    isVisible: boolean;
    onToggle: () => void;
}> = ({ id, label, isVisible, onToggle }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`users-page__columns-option${isDragging ? " users-page__columns-option--dragging" : ""}`}
        >
            <button className="users-page__columns-drag-btn" type="button" {...attributes} {...listeners}>
                <GripIcon />
            </button>
            <Checkbox inputSize="m" checked={isVisible} onCheckedChange={onToggle} />
            <span className="users-page__columns-label" onClick={onToggle}>
                {label}
            </span>
        </div>
    );
};
