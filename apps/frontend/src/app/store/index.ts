/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { configureStore } from "@reduxjs/toolkit";

import { emptyRootReducer } from "@/shared/lib/redux";

export const store = configureStore({
    reducer: emptyRootReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware()
});

declare global {
    type AppState = ReturnType<typeof store.getState>;
    type AppDispatch = typeof store.dispatch;
}
