/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { COMMON, USERS } from "@helpdesk-portal/i18n";
import ExportIcon from "@helpdesk-portal/icons/Export.svg?react";
import GearIcon from "@helpdesk-portal/icons/GearIcon.svg?react";
import PlusIcon from "@helpdesk-portal/icons/Plus.svg?react";
import SearchIcon from "@helpdesk-portal/icons/Search.svg?react";
import { Button, Input, Select, Switch } from "@helpdesk-portal/ui-kit";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type SortingState } from "@tanstack/react-table";
import { useRef, useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { rootReducer } from "@/app/store";

import { createUser, deleteUser, fetchUsers, updateUser } from "@/entities/user";
import type { CreateUserData, FetchUsersParams, UpdateUserData, User } from "@/entities/user";

import { i18n } from "@/shared/lib/i18n";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { useClickOutside } from "@/shared/lib/use-click-outside";
import { useDynamicPerPage } from "@/shared/lib/use-dynamic-per-page";
import { usePersistColumnSettings } from "@/shared/lib/use-persist-column-settings";
import { useTable } from "@/shared/lib/use-table";

import { DataTable, SortableColumnItem, reorderColumn } from "@/shared/ui/data-table";

import { ALL_COLUMNS, getRoleOptions, getUsersColumns } from "../model/columns";
import {
    selectColumnOrder,
    selectColumnVisibility,
    selectRowSelection,
    setColumnOrder,
    setColumnVisibility,
    setRowSelection,
    usersPageSlice
} from "../model/users-page-slice";
import "./UsersPage.css";

rootReducer.inject(usersPageSlice);

export const UsersPage: FC = () => {
    const { t } = useTranslation(USERS);
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
    const rowSelection = useAppSelector(selectRowSelection);
    const [columnsOpen, setColumnsOpen] = useState(false);
    const columnsRef = useRef<HTMLDivElement>(null);

    const { perPage, ready } = useDynamicPerPage(containerRef, {
        rowHeight: 57,
        theadHeight: 41,
        paginationHeight: 36,
        min: 5
    });

    useClickOutside(columnsRef, () => setColumnsOpen(false));

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

    const selectedIds = Object.keys(rowSelection).map(Number);
    const selectedCount = selectedIds.length;

    const { mutateAsync: deleteSelectedMutate } = useMutation({
        mutationFn: (id: number) => deleteUser(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
    });

    const handleDeleteSelected = async () => {
        if (!window.confirm(t("confirm.deleteSelected", { count: selectedCount }))) return;
        await Promise.all(selectedIds.map(id => deleteSelectedMutate(id)));
        dispatch(setRowSelection({}));
    };

    const columns = getUsersColumns({ t, updateRoleMutate, setEditingUser });

    function handleDragEnd(event: DragEndEvent) {
        reorderColumn(event, columnOrder, next => dispatch(setColumnOrder(next)));
    }

    const { table } = useTable({
        data: users,
        columns,
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
        rowSelection,
        onRowSelectionChange: updater => {
            const next = typeof updater === "function" ? updater(rowSelection) : updater;
            dispatch(setRowSelection(next));
        },
        resetKey: debouncedQ,
        enableRowSelection: true
    });

    usePersistColumnSettings({
        page: "users",
        columnVisibility,
        columnOrder,
        onColumnVisibilityChange: updater => {
            const next = typeof updater === "function" ? updater(columnVisibility) : updater;
            dispatch(setColumnVisibility(next));
        },
        onColumnOrderChange: updater => {
            const next = typeof updater === "function" ? updater(columnOrder) : updater;
            dispatch(setColumnOrder(next));
        }
    });

    return (
        <div className="users-page">
            <div className="users-page__title-area">
                <div className="users-page__title-text">
                    <h1 className="users-page__title-heading">{t("page.title")}</h1>
                    <p className="users-page__title-subtitle">{t("page.subtitle", { count: total })}</p>
                </div>
                <div className="users-page__actions">
                    <Button
                        className="users-page__create-btn"
                        type="button"
                        onClick={() => setCreating(true)}
                        startIcon={<PlusIcon />}
                    >
                        {t("actions.create")}
                    </Button>
                    {selectedCount > 0 && (
                        <Button variant="stroke" color="error" size="m" onClick={handleDeleteSelected}>
                            {t("actions.deleteSelected", { count: selectedCount })}
                        </Button>
                    )}
                    <Button className="users-page__export-btn" type="button" startIcon={<ExportIcon />}>
                        {t("actions.export")}
                    </Button>
                    <div className="users-page__columns-wrapper" ref={columnsRef}>
                        <Button
                            className="users-page__columns-btn"
                            type="button"
                            onClick={() => setColumnsOpen(v => !v)}
                            startIcon={<GearIcon />}
                        >
                            {t("actions.columns")}
                        </Button>
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
    if (!value.trim()) return i18n.t(`${USERS}:validation.required.email`);
    if (!LOGIN_EMAIL_PATTERN.test(value.trim())) return i18n.t(`${USERS}:validation.invalid.email`);
}

function validatePasswordCreate(value: string): string | undefined {
    if (!value) return i18n.t(`${USERS}:validation.required.password`);
    if (value.length < 6) return i18n.t(`${USERS}:validation.minLength.password`);
}

const CreateUserForm: FC<CreateUserFormProps> = ({ onSubmit, onCancel }) => {
    const { t: tu } = useTranslation(USERS);
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("USER");
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
            setServerError(err instanceof Error ? err.message : i18n.t(`${USERS}:create.error`));
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
                    <Switch checked={showPassword} onCheckedChange={setShowPassword} />
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
                    {tu(`${COMMON}:cancel`)}
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
    const { t: tu } = useTranslation(USERS);
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<string>(user.role);
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const loginError =
        login.trim() && !LOGIN_EMAIL_PATTERN.test(login.trim())
            ? i18n.t(`${USERS}:validation.invalid.email`)
            : undefined;
    const passwordError =
        password.length > 0 && password.length < 6 ? i18n.t(`${USERS}:validation.minLength.password`) : undefined;
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
                setServerError(i18n.t(`${USERS}:edit.noChanges`));
                setSubmitting(false);
                return;
            }
            await onSubmit(data);
        } catch (err) {
            setServerError(err instanceof Error ? err.message : i18n.t(`${USERS}:edit.error`));
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
                    <Switch checked={showPassword} onCheckedChange={setShowPassword} />
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
                    {tu(`${COMMON}:cancel`)}
                </Button>
            </div>
        </form>
    );
};
