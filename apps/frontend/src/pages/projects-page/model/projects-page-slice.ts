import { type TablePageState, createTablePageSlice } from "@/shared/lib/create-table-page-slice";

import { DEFAULT_COLUMN_ORDER, DEFAULT_COLUMN_VISIBILITY } from "./columns";

export type ProjectsPageState = TablePageState;

export const projectsPageSlice = createTablePageSlice("projectsPage", DEFAULT_COLUMN_VISIBILITY, DEFAULT_COLUMN_ORDER);

export const { setColumnVisibility, setColumnOrder, setRowSelection } = projectsPageSlice.actions;

export const { selectColumnVisibility, selectColumnOrder, selectRowSelection } = projectsPageSlice;
