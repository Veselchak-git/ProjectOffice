import { createSelector } from "@reduxjs/toolkit";

import type { TablePageState } from "@/shared/lib/create-table-page-slice";
import { createTablePageSlice } from "@/shared/lib/create-table-page-slice";

import { DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } from "./columns";

export type IssuesPageState = TablePageState;

export const issuesPageSlice = createTablePageSlice("issuesPage", DEFAULT_COLUMN_VISIBILITY, DEFAULT_COLUMN_ORDER);

export const { setColumnVisibility, setColumnOrder, setRowSelection } = issuesPageSlice.actions;

const getSlice = (state: AppState) => state.issuesPage;

export const selectColumnVisibility = createSelector(
    [getSlice],
    slice => slice?.columnVisibility ?? DEFAULT_COLUMN_VISIBILITY
);
export const selectColumnOrder = createSelector([getSlice], slice => slice?.columnOrder ?? DEFAULT_COLUMN_ORDER);
export const selectRowSelection = createSelector([getSlice], slice => slice?.rowSelection ?? {});
