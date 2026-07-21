import { createSelector } from "@reduxjs/toolkit";

import type { TablePageState } from "@/shared/lib/create-table-page-slice";
import { createTablePageSlice } from "@/shared/lib/create-table-page-slice";

import { DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } from "./columns";

export type AuditLogPageState = TablePageState;

export const auditLogPageSlice = createTablePageSlice("auditLogPage", DEFAULT_COLUMN_VISIBILITY, DEFAULT_COLUMN_ORDER);

export const { setColumnVisibility, setColumnOrder } = auditLogPageSlice.actions;

const getSlice = (state: AppState) => state.auditLogPage;

export const selectColumnVisibility = createSelector(
    [getSlice],
    slice => slice?.columnVisibility ?? DEFAULT_COLUMN_VISIBILITY
);
export const selectColumnOrder = createSelector([getSlice], slice => slice?.columnOrder ?? DEFAULT_COLUMN_ORDER);
