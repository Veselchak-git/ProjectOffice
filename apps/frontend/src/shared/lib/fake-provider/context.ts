/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { createContext } from "react";

import type { IFakeProviderState } from "./type";

export const FakeProviderContext = createContext<IFakeProviderState>({ foo: "bar" });
