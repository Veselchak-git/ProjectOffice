import { createSelector } from "@reduxjs/toolkit";

import { rootReducer } from "@/app/store";

import type { TablePageState } from "@/shared/lib/create-table-page-slice";
import { createTablePageSlice } from "@/shared/lib/create-table-page-slice";

import { DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } from "./columns";

export type UsersPageState = TablePageState;

export const usersPageSlice = createTablePageSlice("usersPage", DEFAULT_COLUMN_VISIBILITY, DEFAULT_COLUMN_ORDER);

rootReducer.inject(usersPageSlice);

export const { setColumnVisibility, setColumnOrder, setRowSelection } = usersPageSlice.actions;

const getSlice = (state: AppState) => state.usersPage;

export const selectColumnVisibility = createSelector(
    [getSlice],
    slice => slice?.columnVisibility ?? DEFAULT_COLUMN_VISIBILITY
);
export const selectColumnOrder = createSelector([getSlice], slice => slice?.columnOrder ?? DEFAULT_COLUMN_ORDER);
export const selectRowSelection = createSelector([getSlice], slice => slice?.rowSelection ?? {});
