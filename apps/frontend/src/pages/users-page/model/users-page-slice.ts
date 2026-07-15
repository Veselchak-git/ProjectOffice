import { type TablePageState, createTablePageSlice } from "@/shared/lib/create-table-page-slice";

import { DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } from "./columns";

export type UsersPageState = TablePageState;

export const usersPageSlice = createTablePageSlice("usersPage", DEFAULT_COLUMN_VISIBILITY, DEFAULT_COLUMN_ORDER);

export const { setColumnVisibility, setColumnOrder, setRowSelection } = usersPageSlice.actions;

export const { selectColumnVisibility, selectColumnOrder, selectRowSelection } = usersPageSlice;
