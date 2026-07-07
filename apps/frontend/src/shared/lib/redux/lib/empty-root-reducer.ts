/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { combineSlices } from "@reduxjs/toolkit";

import type { LazyLoadedReduxSlices } from "./lazy-loaded-redux-slices";

export const emptyRootReducer = combineSlices().withLazyLoadedSlices<LazyLoadedReduxSlices>();
