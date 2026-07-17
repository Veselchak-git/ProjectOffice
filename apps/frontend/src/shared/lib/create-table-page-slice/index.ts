import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

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

    return createSlice({
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
        },
        selectors: {
            selectColumnVisibility: state => state?.columnVisibility ?? defaultColumnVisibility,
            selectColumnOrder: state => state?.columnOrder ?? defaultColumnOrder,
            selectRowSelection: state => state?.rowSelection ?? {}
        }
    });
}
