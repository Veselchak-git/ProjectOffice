/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { combineSlices, configureStore } from "@reduxjs/toolkit";

import { authSlice } from "@/shared/lib/auth";
import type { LazyLoadedReduxSlices } from "@/shared/lib/redux";

export const rootReducer = combineSlices(authSlice).withLazyLoadedSlices<LazyLoadedReduxSlices>();

export const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware()
});
