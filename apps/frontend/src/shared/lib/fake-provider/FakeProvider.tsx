/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { type FC, type PropsWithChildren, useMemo } from "react";

import { FakeProviderContext } from "./context";
import type { IFakeProviderState } from "./type";

export const FakeProvider: FC<PropsWithChildren<{ foo: string }>> = ({ children, foo }) => {
    const value = useMemo<IFakeProviderState>(() => ({ foo: foo }), [foo]);
    return <FakeProviderContext.Provider value={value}>{children}</FakeProviderContext.Provider>;
};
