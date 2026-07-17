/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { USERS } from "@helpdesk-portal/i18n";
import { Select } from "@helpdesk-portal/ui-kit";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import type { TFunction } from "i18next";

import type { User } from "@/entities/user";

import { createColumnMeta, createDateColumn, createSelectColumn } from "@/shared/ui/data-table";

import { UsersActionsCell } from "../ui/UsersActionsCell";

export interface GetUsersColumnsDeps {
    t: TFunction;
    updateRoleMutate: (params: { id: number; role: User["role"] }) => void;
    setEditingUser: (user: User | null) => void;
}

const columnHelper = createColumnHelper<User>();

export const getRoleOptions = (t: (key: string) => string) => [
    { value: "GUEST" as const, label: t("roles.guest") },
    { value: "USER" as const, label: t("roles.user") },
    { value: "ADMIN" as const, label: t("roles.admin") }
];

export function getUsersColumns({ t, updateRoleMutate, setEditingUser }: GetUsersColumnsDeps): ColumnDef<User>[] {
    return [
        createSelectColumn(columnHelper),
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
        createDateColumn(columnHelper, t),
        columnHelper.display({
            id: "actions",
            header: "",
            size: 200,
            minSize: 200,
            cell: info => <UsersActionsCell user={info.row.original} onEdit={setEditingUser} />
        })
    ] as ColumnDef<User>[];
}

export const { ALL_COLUMNS, COLUMN_IDS, DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } = createColumnMeta([
    { id: "login", label: `${USERS}:table.login` },
    { id: "role", label: `${USERS}:table.role` },
    { id: "createdAt", label: `${USERS}:table.created` },
    { id: "actions", label: "" }
]);
