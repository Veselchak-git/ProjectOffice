import { type PayloadAction, createSelector, createSlice } from "@reduxjs/toolkit";

import { DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } from "./columns";

export interface IssuesPageState {
    columnVisibility: Record<string, boolean>;
    columnOrder: string[];
    rowSelection: Record<string, boolean>;
}

const initialState: IssuesPageState = {
    columnVisibility: DEFAULT_COLUMN_VISIBILITY,
    columnOrder: DEFAULT_COLUMN_ORDER,
    rowSelection: {}
};

export const issuesPageSlice = createSlice({
    name: "issuesPage",
    initialState,
    reducers: {
        setColumnVisibility(state, action: PayloadAction<Record<string, boolean>>) {
            state.columnVisibility = action.payload;
        },
        setColumnOrder(state, action: PayloadAction<string[]>) {
            state.columnOrder = action.payload;
        },
        setRowSelection(state, action: PayloadAction<Record<string, boolean>>) {
            state.rowSelection = action.payload;
        },
        resetRowSelection(state) {
            state.rowSelection = {};
        },
        resetPageState(state) {
            state.columnVisibility = DEFAULT_COLUMN_VISIBILITY;
            state.columnOrder = DEFAULT_COLUMN_ORDER;
            state.rowSelection = {};
        }
    }
});

export const { setColumnVisibility, setColumnOrder, setRowSelection, resetRowSelection, resetPageState } =
    issuesPageSlice.actions;

const selectIssuesPage = (state: AppState) => state.issuesPage;

export const selectColumnVisibility = createSelector(
    selectIssuesPage,
    page => page?.columnVisibility ?? DEFAULT_COLUMN_VISIBILITY
);

export const selectColumnOrder = createSelector(selectIssuesPage, page => page?.columnOrder ?? DEFAULT_COLUMN_ORDER);

export const selectRowSelection = createSelector(selectIssuesPage, page => page?.rowSelection ?? {});
