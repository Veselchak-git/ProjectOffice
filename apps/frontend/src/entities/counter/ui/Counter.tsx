/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { FC } from "react";

import { useCounter } from "../model";

export const Counter: FC = () => {
    const { count, increment, decrement } = useCounter();
    return (
        <div>
            <button onClick={increment} data-test="increment-button">
                Increment
            </button>
            <button onClick={decrement} data-test="decrement-button">
                Decrement
            </button>
            <p role="status" aria-live="polite" data-test="count-value">
                Count: {count.count}
            </p>
        </div>
    );
};
