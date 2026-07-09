/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { configureStore } from "@reduxjs/toolkit";

import { authSlice } from "@/shared/lib/auth/auth-slice";

export const store = configureStore({
    reducer: {
        auth: authSlice.reducer
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware()
});
