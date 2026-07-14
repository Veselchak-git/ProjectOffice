import { type PayloadAction, createSelector, createSlice } from "@reduxjs/toolkit";

import { DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } from "./columns";

export interface UsersPageState {
    columnVisibility: Record<string, boolean>;
    columnOrder: string[];
}

const initialState: UsersPageState = {
    columnVisibility: DEFAULT_COLUMN_VISIBILITY,
    columnOrder: DEFAULT_COLUMN_ORDER
};

export const usersPageSlice = createSlice({
    name: "usersPage",
    initialState,
    reducers: {
        setColumnVisibility(state, action: PayloadAction<Record<string, boolean>>) {
            state.columnVisibility = action.payload;
        },
        setColumnOrder(state, action: PayloadAction<string[]>) {
            state.columnOrder = action.payload;
        },
        resetPageState(state) {
            state.columnVisibility = DEFAULT_COLUMN_VISIBILITY;
            state.columnOrder = DEFAULT_COLUMN_ORDER;
        }
    }
});

export const { setColumnVisibility, setColumnOrder } = usersPageSlice.actions;

const selectUsersPage = (state: AppState) => state.usersPage;

export const selectColumnVisibility = createSelector(
    selectUsersPage,
    page => page?.columnVisibility ?? DEFAULT_COLUMN_VISIBILITY
);

export const selectColumnOrder = createSelector(selectUsersPage, page => page?.columnOrder ?? DEFAULT_COLUMN_ORDER);
