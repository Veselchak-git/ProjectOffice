/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { useContext } from "react";

import { FakeProviderContext } from "./context";

export const useFakeProviderValue = (safe = true) => {
    const context = useContext(FakeProviderContext);
    if (safe && !context) {
        throw new Error("useFakeProviderValue must be used within a FakeProvider");
    }
    return context;
};
