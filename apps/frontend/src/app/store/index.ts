/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { combineSlices, configureStore } from "@reduxjs/toolkit";

import { issuesPageSlice } from "@/pages/issues-page/model/issues-page-slice";
import { projectsPageSlice } from "@/pages/projects-page/model/projects-page-slice";
import { usersPageSlice } from "@/pages/users-page/model/users-page-slice";

import { authSlice, initAuth, logoutAction, setOnSessionExpired } from "@/shared/lib/auth";
import { localeSlice } from "@/shared/lib/i18n/locale-slice";

import type { LazyLoadedReduxSlices } from "./lazy-loaded-slices";

export const rootReducer = combineSlices(authSlice).withLazyLoadedSlices<LazyLoadedReduxSlices>();

rootReducer.inject(projectsPageSlice);
rootReducer.inject(issuesPageSlice);
rootReducer.inject(usersPageSlice);
rootReducer.inject(localeSlice);

export const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware()
});

setOnSessionExpired(() => store.dispatch(logoutAction()));
initAuth(store.dispatch);
