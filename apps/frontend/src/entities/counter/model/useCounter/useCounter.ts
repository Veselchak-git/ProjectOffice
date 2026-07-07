/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { useState } from "react";

import type { IEntityCounter } from "../type";

export const useCounter = (initialValue: number = 0) => {
    const [count, setCount] = useState<IEntityCounter>({ count: initialValue });

    const increment = () => {
        setCount(prev => ({ count: prev.count + 1 }));
    };

    const decrement = () => {
        setCount(prev => ({ count: prev.count - 1 }));
    };

    return { count, increment, decrement };
};
