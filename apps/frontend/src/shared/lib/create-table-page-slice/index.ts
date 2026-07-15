import { type PayloadAction, createSelector, createSlice } from "@reduxjs/toolkit";

export interface TablePageState {
    columnVisibility: Record<string, boolean>;
    columnOrder: string[];
    rowSelection: Record<string, boolean>;
}

export function createTablePageSlice(
    name: "projectsPage" | "issuesPage" | "usersPage",
    defaultColumnVisibility: Record<string, boolean>,
    defaultColumnOrder: string[]
) {
    const initialState: TablePageState = {
        columnVisibility: defaultColumnVisibility,
        columnOrder: defaultColumnOrder,
        rowSelection: {}
    };

    const slice = createSlice({
        name,
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
            }
        }
    });

    const selectPage = (state: AppState) => state[name] as TablePageState | undefined;

    return Object.assign(slice, {
        selectColumnVisibility: createSelector(selectPage, page => page?.columnVisibility ?? defaultColumnVisibility),
        selectColumnOrder: createSelector(selectPage, page => page?.columnOrder ?? defaultColumnOrder),
        selectRowSelection: createSelector(selectPage, page => page?.rowSelection ?? {})
    });
}
