import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } from "./columns";

export interface ProjectsPageState {
    columnVisibility: Record<string, boolean>;
    columnOrder: string[];
    rowSelection: Record<string, boolean>;
}

const initialState: ProjectsPageState = {
    columnVisibility: DEFAULT_COLUMN_VISIBILITY,
    columnOrder: DEFAULT_COLUMN_ORDER,
    rowSelection: {},
};

export const projectsPageSlice = createSlice({
    name: "projectsPage",
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
        },
    },
});

export const { setColumnVisibility, setColumnOrder, setRowSelection, resetRowSelection, resetPageState } =
    projectsPageSlice.actions;

const selectProjectsPage = (state: AppState) => state.projectsPage;

export const selectColumnVisibility = createSelector(
    selectProjectsPage,
    page => page?.columnVisibility ?? DEFAULT_COLUMN_VISIBILITY,
);

export const selectColumnOrder = createSelector(
    selectProjectsPage,
    page => page?.columnOrder ?? DEFAULT_COLUMN_ORDER,
);

export const selectRowSelection = createSelector(
    selectProjectsPage,
    page => page?.rowSelection ?? {},
);
