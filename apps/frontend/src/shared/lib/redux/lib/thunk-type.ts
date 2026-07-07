/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { Action, AsyncThunk, ThunkAction } from "@reduxjs/toolkit";
import type { NavigateFunction } from "react-router";

export type BaseThunkType<A extends Action = Action, R = Promise<void> | void> = ThunkAction<
    R,
    AppState,
    { navigate: NavigateFunction | null },
    A
>;
export type BaseAsyncThunkType<R = unknown, A = unknown> = AsyncThunk<
    R,
    A,
    { state: AppState; dispatch: AppDispatch; extra: { navigate: NavigateFunction | null } }
>;
