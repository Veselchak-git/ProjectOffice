import { type TablePageState, createTablePageSlice } from "@/shared/lib/create-table-page-slice";

import { DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } from "./columns";

export type IssuesPageState = TablePageState;

export const issuesPageSlice = createTablePageSlice("issuesPage", DEFAULT_COLUMN_VISIBILITY, DEFAULT_COLUMN_ORDER);

export const { setColumnVisibility, setColumnOrder, setRowSelection } = issuesPageSlice.actions;

export const { selectColumnVisibility, selectColumnOrder, selectRowSelection } = issuesPageSlice;
