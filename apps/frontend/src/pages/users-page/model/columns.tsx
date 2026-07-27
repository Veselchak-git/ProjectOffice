/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { USERS } from "@helpdesk-portal/i18n";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import type { TFunction } from "i18next";

import type { User } from "@/entities/user";

import { createColumnMeta } from "@/shared/ui/data-table";
import { createDateColumn, createSelectColumn } from "@/shared/ui/data-table/column-helpers";

export interface GetUsersColumnsDeps {
    t: TFunction;
}

const columnHelper = createColumnHelper<User>();

export const getRoleOptions = (t: (key: string) => string) => [
    { value: "USER" as const, label: t("roles.user") },
    { value: "ADMIN" as const, label: t("roles.admin") }
];

export function getUsersColumns({ t }: GetUsersColumnsDeps): ColumnDef<User>[] {
    return [
        createSelectColumn(columnHelper),
        columnHelper.accessor("login", {
            header: t("table.login"),
            enableSorting: true
        }),
        columnHelper.accessor("role", {
            header: t("table.role"),
            enableSorting: true,
            cell: info => {
                const role = info.getValue();
                return getRoleOptions(t).find(o => o.value === role)?.label ?? role;
            }
        }),
        createDateColumn(columnHelper, t)
    ] as ColumnDef<User>[];
}

export const { ALL_COLUMNS, COLUMN_IDS, DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } = createColumnMeta([
    { id: "login", label: `${USERS}:table.login` },
    { id: "role", label: `${USERS}:table.role` },
    { id: "createdAt", label: `${USERS}:table.created` },
    { id: "actions", label: "" }
]);
