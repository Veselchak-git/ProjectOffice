/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { COMMON, USERS } from "@helpdesk-portal/i18n";
import ExportIcon from "@helpdesk-portal/icons/Export.svg?react";
import PlusIcon from "@helpdesk-portal/icons/Plus.svg?react";
import { Button, Input, Modal, Select, Switch } from "@helpdesk-portal/ui-kit";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import type { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { UserForm, createUser, deleteUser, fetchUsers, updateUser } from "@/entities/user";
import type { CreateUserData, FetchUsersParams, UpdateUserData, User } from "@/entities/user";

import { ErrorModal } from "@/shared/lib/error-boundary/ErrorModal";
import { formatDate } from "@/shared/lib/format-date";
import { i18n } from "@/shared/lib/i18n";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { useTable } from "@/shared/lib/use-table";
import { useFilterState, usePopoverKeys } from "@/shared/lib/use-table-filter";
import type { FieldOption } from "@/shared/lib/use-table-filter/types";
import { useTablePage } from "@/shared/lib/use-table-page";
import { getLoginEmailRules, getLoginPasswordRules } from "@/shared/lib/validation";

import { ColumnsDropdown } from "@/shared/ui/columns-dropdown";
import { DataTable, FilterChips, useFilterHeader } from "@/shared/ui/data-table";
import { createSelectColumn } from "@/shared/ui/data-table/column-helpers";
import { ExportModal } from "@/shared/ui/export-modal";
import { PageHeader } from "@/shared/ui/page-header";

import { ALL_COLUMNS, getRoleOptions } from "../model/columns";
import {
    selectColumnOrder,
    selectColumnVisibility,
    selectRowSelection,
    setColumnOrder,
    setColumnVisibility,
    setRowSelection
} from "../model/users-page-slice";
import styles from "./UsersPage.module.css";

export const UsersPage: FC = () => {
    const { t } = useTranslation(USERS);
    const filterConfig = useMemo<{ fields: FieldOption[] }>(
        () => ({
            fields: [
                { field: "login", label: t("filter.login"), type: "text" },
                {
                    field: "role",
                    label: t("filter.role"),
                    type: "enum",
                    enumValues: [
                        { value: "ADMIN", label: t("filter.roleOptions.ADMIN") },
                        { value: "USER", label: t("filter.roleOptions.USER") }
                    ]
                },
                { field: "createdAt", label: t("filter.createdAt"), type: "date" }
            ]
        }),
        [t]
    );
    const queryClient = useQueryClient();
    const [pageError, setPageError] = useState<string | null>(null);
    const [openFilter, setOpenFilter] = useState<string | null>(null);
    const { popoverKeys, bumpKey } = usePopoverKeys();
    const [creating, setCreating] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [bulkRoleChange, setBulkRoleChange] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const dispatch = useAppDispatch();
    const columnVisibility = useAppSelector(selectColumnVisibility);
    const columnOrder = useAppSelector(selectColumnOrder);
    const rowSelection = useAppSelector(selectRowSelection);

    const filterState = useFilterState("users", filterConfig);
    const {
        filters,
        setFilters,
        applyFilters,
        resetFilters,
        hasActiveFilters,
        filterQueryString,
        allConditions,
        currentLogic,
        applyConditions,
        removeFieldConditions
    } = filterState;

    const {
        containerRef,
        columnsRef,
        columnsOpen,
        setColumnsOpen,
        handleDragEnd,
        sorting,
        perPage,
        ready,
        pageIndex,
        setPageIndex,
        setSorting
    } = useTablePage({
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

    const sortBy = sorting[0]?.id;
    const sortOrder: "asc" | "desc" | undefined = sorting[0]?.desc ? "desc" : sorting[0] ? "asc" : undefined;
    const page = pageIndex + 1;

    const columnHelper = useMemo(() => createColumnHelper<User>(), []);

    const handleSort = useCallback(
        (columnId: string) => {
            setSorting(prev => {
                const current = prev.find(s => s.id === columnId);
                if (!current) return [{ id: columnId, desc: false }];
                if (!current.desc) return [{ id: columnId, desc: true }];
                return [];
            });
        },
        [setSorting]
    );

    const isFieldFiltered = useCallback(
        (field: string) => filters.groups[0]?.conditions.some(c => c.field === field) ?? false,
        [filters]
    );

    const renderFilterHeader = useFilterHeader({
        sorting,
        isFieldFiltered,
        filterConfig,
        allConditions,
        currentLogic,
        applyConditions,
        removeFieldConditions,
        openFilter,
        setOpenFilter,
        bumpKey,
        popoverKeys
    });

    const roleFields = useMemo(
        () => filterConfig.fields.map(f => (f.field === "role" ? { ...f, enumValues: getRoleOptions(t) } : f)),
        [filterConfig.fields, t]
    );

    const columns = useMemo(
        () =>
            [
                createSelectColumn(columnHelper),
                columnHelper.accessor("login", {
                    header: renderFilterHeader(t("table.login"), "login"),
                    enableSorting: true
                }),
                columnHelper.accessor("role", {
                    header: renderFilterHeader(t("table.role"), "role", roleFields),
                    enableSorting: true,
                    cell: info => {
                        const role = info.getValue();
                        return getRoleOptions(t).find(o => o.value === role)?.label ?? role;
                    }
                }),
                columnHelper.accessor(row => row.createdAt, {
                    id: "createdAt",
                    header: renderFilterHeader(t("table.created"), "createdAt"),
                    enableSorting: true,
                    cell: info => formatDate(info.getValue())
                })
            ] as ColumnDef<User>[],
        [columnHelper, t, renderFilterHeader, roleFields]
    );

    const userParams = {
        page,
        perPage,
        ...(sortBy ? { sortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
        ...(filterQueryString ? { filter: filterQueryString } : {})
    } satisfies FetchUsersParams;

    const { data, isPending, isError, error } = useQuery({
        queryKey: ["users", userParams],
        queryFn: () => fetchUsers(userParams),
        enabled: ready,
        placeholderData: keepPreviousData,
        refetchInterval: 30000
    });

    const users = data?.users ?? [];
    const total = data?.total ?? 0;

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
        resetKey: filterQueryString ?? "",
        enableRowSelection: true
    });

    const { mutateAsync: createUserMutate } = useMutation({
        mutationFn: (dto: CreateUserData) => createUser(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setCreating(false);
        }
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

    const handleDeleteSelected = async () => {
        setPageError(null);
        if (!window.confirm(t("confirm.deleteSelected", { count: selectedCount }))) return;
        try {
            await Promise.all(selectedIds.map(id => deleteUser(id)));
            queryClient.invalidateQueries({ queryKey: ["users"] });
            dispatch(setRowSelection({}));
        } catch (err) {
            setPageError(err instanceof Error ? err.message : "Error");
        }
    };

    return (
        <div className={styles["users-page"]}>
            <PageHeader
                title={t("page.title")}
                subtitle={t("page.subtitle", { count: total })}
                actions={
                    <>
                        <Button
                            className={styles["users-page__create-btn"]}
                            type="button"
                            onClick={() => {
                                setPageError(null);
                                setCreating(true);
                            }}
                            startIcon={<PlusIcon />}
                        >
                            {t("actions.create")}
                        </Button>
                        {selectedCount > 0 && (
                            <Button variant="stroke" color="error" size="m" onClick={handleDeleteSelected}>
                                {t("actions.deleteSelected", { count: selectedCount })}
                            </Button>
                        )}
                        {selectedCount > 0 && (
                            <Button
                                variant="stroke"
                                size="m"
                                onClick={() => {
                                    setPageError(null);
                                    if (selectedCount === 1) {
                                        const userId = selectedIds[0];
                                        const user = users.find(u => u.id === userId);
                                        if (user) setEditingUser(user);
                                    } else {
                                        setBulkRoleChange(true);
                                    }
                                }}
                            >
                                {t("table.edit")}
                            </Button>
                        )}
                        <Button
                            className={styles["users-page__export-btn"]}
                            type="button"
                            onClick={() => setExportOpen(true)}
                            startIcon={<ExportIcon />}
                        >
                            {t("actions.export")}
                        </Button>
                        <ColumnsDropdown
                            columnsRef={columnsRef}
                            columnsOpen={columnsOpen}
                            setColumnsOpen={setColumnsOpen}
                            columnOrder={columnOrder}
                            allColumns={ALL_COLUMNS}
                            table={table}
                            handleDragEnd={handleDragEnd}
                            exclude={["select", "actions"]}
                        />
                    </>
                }
            />

            {hasActiveFilters && (
                <FilterChips
                    conditions={allConditions}
                    fieldConfigs={filterConfig.fields}
                    onRemove={conditionId => {
                        const allConditions = filters.groups.flatMap(g => g.conditions);
                        const otherConditions = allConditions.filter(c => c.id !== conditionId);
                        const nextState = {
                            groups: [{ logic: filters.groups[0]?.logic ?? "AND", conditions: otherConditions }],
                            fieldConfigs: filterConfig.fields
                        };
                        setFilters(nextState);
                        applyFilters(nextState);
                    }}
                    onClearAll={() => resetFilters()}
                />
            )}

            <div className={styles["users-page__table-area"]} ref={containerRef}>
                {isPending && !data ? (
                    <p className={styles["users-page__empty"]}>{t("loading")}</p>
                ) : (
                    <DataTable table={table} total={total} sorting={sorting} onSort={handleSort} />
                )}
            </div>

            <Modal isOpen={creating} onClose={() => setCreating(false)} title={t("create.title")}>
                <UserForm
                    onSubmit={data => createUserMutate(data).then(() => {})}
                    onCancel={() => setCreating(false)}
                    onFormError={setPageError}
                />
            </Modal>

            <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title={t("edit.title")}>
                {editingUser && (
                    <EditUserForm
                        user={editingUser}
                        onSubmit={data => editUserMutate({ id: editingUser.id, data }).then(() => {})}
                        onCancel={() => setEditingUser(null)}
                        onFormError={setPageError}
                    />
                )}
            </Modal>

            {bulkRoleChange && (
                <BulkRoleChangeModal
                    count={selectedCount}
                    onConfirm={async role => {
                        setPageError(null);
                        try {
                            await Promise.all(selectedIds.map(id => updateUser(id, { role })));
                            queryClient.invalidateQueries({ queryKey: ["users"] });
                            dispatch(setRowSelection({}));
                            setBulkRoleChange(false);
                        } catch (err) {
                            setPageError(err instanceof Error ? err.message : "Error");
                        }
                    }}
                    onCancel={() => setBulkRoleChange(false)}
                />
            )}

            <ExportModal
                isOpen={exportOpen}
                onClose={() => setExportOpen(false)}
                onExport={() => {
                    setExportOpen(false);
                }}
                exportUrl="/api/export/users"
                hasActiveFilters={hasActiveFilters}
                hasActiveSorting={sorting.length > 0}
                {...(hasActiveFilters
                    ? {
                          activeFiltersDescription: allConditions
                              .map(c => filterConfig.fields.find(f => f.field === c.field)?.label ?? c.field)
                              .join(", ")
                      }
                    : {})}
                {...(sorting.length > 0
                    ? {
                          activeSortingDescription: sorting
                              .map(s => {
                                  const label = t(`table.${s.id === "createdAt" ? "created" : s.id}`);
                                  return `${label} ${s.desc ? "↓" : "↑"}`;
                              })
                              .join(", ")
                      }
                    : {})}
                {...(filterQueryString ? { filterQueryString } : {})}
                {...(sortBy ? { sortBy } : {})}
                {...(sortOrder ? { sortOrder } : {})}
                columnNamespace={USERS}
                availableLocales={["ru", "en"]}
                columnLabelKeys={{
                    login: "table.login",
                    role: "table.role",
                    createdAt: "table.created"
                }}
            />

            <ErrorModal
                isOpen={!!pageError || (isError && !isPending)}
                message={pageError ?? (error instanceof Error ? error.message : t("error.loading"))}
                onClose={() => setPageError(null)}
                {...((error as { code?: string })?.code === "AUTH_FORBIDDEN" ? { onOkNavigate: "/" } : {})}
            />
        </div>
    );
};

interface EditUserFormProps {
    user: User;
    onSubmit(data: UpdateUserData): Promise<void>;
    onCancel(): void;
    onFormError?(msg: string | null): void;
}

interface EditFormValues {
    login: string;
    password: string;
    role: string;
}

const EditUserForm: FC<EditUserFormProps> = ({ user, onSubmit, onCancel, onFormError }) => {
    const { t: tu } = useTranslation(USERS);
    const [showPassword, setShowPassword] = useState(false);

    const {
        control,
        handleSubmit: rhfHandleSubmit,
        formState: { errors, isSubmitting, isDirty }
    } = useForm<EditFormValues>({
        mode: "onChange",
        defaultValues: { login: "", password: "", role: user.role }
    });

    const loginRules = getLoginEmailRules(i18n.t);
    const passwordRules = getLoginPasswordRules(i18n.t);

    const hasErrors = Object.keys(errors).length > 0;
    const canSubmit = isDirty && !hasErrors && !isSubmitting;

    const handleFormSubmit = async (data: EditFormValues) => {
        try {
            const updateData: UpdateUserData = {};
            if (data.login.trim()) updateData.login = data.login.trim();
            if (data.password) updateData.password = data.password;
            if (data.role !== user.role) updateData.role = data.role as User["role"];
            if (Object.keys(updateData).length === 0) {
                onFormError?.(i18n.t(`${USERS}:edit.noChanges`));
                return;
            }
            await onSubmit(updateData);
        } catch (err) {
            onFormError?.(err instanceof Error ? err.message : i18n.t(`${USERS}:edit.error`));
        }
    };

    return (
        <form className={styles["users-page__form"]} onSubmit={rhfHandleSubmit(handleFormSubmit)} noValidate>
            <div className={styles["users-page__old-data"]}>
                <span className={styles["users-page__old-data-label"]}>{tu("edit.currentData")}</span>
                <div className={styles["users-page__old-data-row"]}>
                    <span className={styles["users-page__old-data-key"]}>{tu("edit.loginLabel")}</span>
                    <span className={styles["users-page__old-data-value"]}>{user.login}</span>
                </div>
                <div className={styles["users-page__old-data-row"]}>
                    <span className={styles["users-page__old-data-key"]}>{tu("edit.roleLabel")}</span>
                    <span className={styles["users-page__old-data-value"]}>
                        {getRoleOptions(tu).find(o => o.value === user.role)?.label ?? user.role}
                    </span>
                </div>
            </div>

            <Controller
                name="login"
                control={control}
                rules={loginRules}
                render={({ field, fieldState }) => (
                    <Input
                        {...field}
                        label={tu("edit.newLogin")}
                        type="email"
                        placeholder={tu("edit.newLoginPlaceholder")}
                        color={fieldState.error ? "error" : "default"}
                        errorMessage={fieldState.error?.message}
                    />
                )}
            />
            <div className={styles["users-page__password-field"]}>
                <Controller
                    name="password"
                    control={control}
                    rules={passwordRules}
                    render={({ field, fieldState }) => (
                        <Input
                            {...field}
                            label={tu("edit.newPassword")}
                            type={showPassword ? "text" : "password"}
                            placeholder={tu("edit.newPasswordPlaceholder")}
                            color={fieldState.error ? "error" : "default"}
                            errorMessage={fieldState.error?.message}
                        />
                    )}
                />
                <label className={styles["users-page__checkbox-row"]}>
                    <Switch checked={showPassword} onCheckedChange={setShowPassword} />
                    <span>{tu("edit.showPassword")}</span>
                </label>
            </div>
            <Controller
                name="role"
                control={control}
                render={({ field }) => (
                    <Select
                        label={tu("form.role")}
                        options={getRoleOptions(tu)}
                        value={field.value}
                        usePortal={false}
                        onValueChange={field.onChange}
                    />
                )}
            />
            <div className={styles["users-page__form-actions"]}>
                <Button type="submit" disabled={!canSubmit}>
                    {isSubmitting ? tu("edit.saving") : tu("edit.save")}
                </Button>
                <Button type="button" variant="stroke" onClick={onCancel}>
                    {tu(`${COMMON}:cancel`)}
                </Button>
            </div>
        </form>
    );
};

interface BulkRoleChangeModalProps {
    count: number;
    onConfirm(role: User["role"]): Promise<void>;
    onCancel(): void;
}

const BulkRoleChangeModal: FC<BulkRoleChangeModalProps> = ({ count, onConfirm, onCancel }) => {
    const { t: tu } = useTranslation(USERS);
    const [role, setRole] = useState<User["role"]>("USER");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasChanges = role !== "USER";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onConfirm(role);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onCancel} title={tu("bulkRoleChange.title", { count })}>
            <form className={styles["users-page__form"]} onSubmit={handleSubmit}>
                <Select
                    label={tu("form.role")}
                    options={getRoleOptions(tu)}
                    value={role}
                    usePortal={false}
                    onValueChange={value => setRole(value as User["role"])}
                />
                <div className={styles["users-page__form-actions"]}>
                    <Button type="submit" disabled={isSubmitting || !hasChanges}>
                        {isSubmitting ? tu("bulkRoleChange.submitting") : tu("bulkRoleChange.submit")}
                    </Button>
                    <Button type="button" variant="stroke" onClick={onCancel} disabled={isSubmitting}>
                        {tu(`${COMMON}:cancel`)}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
