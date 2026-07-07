/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { FC, PropsWithChildren } from "react";

import { FakeProvider } from "@/shared/lib/FakeProvider/FakeProvider";

export const FakeProviderWithValue: FC<PropsWithChildren> = ({ children }) => {
    return <FakeProvider foo={"top lvl context value"}>{children}</FakeProvider>;
};
