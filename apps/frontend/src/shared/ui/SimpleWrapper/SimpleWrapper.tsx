/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 * Copyright (c) 2016-2026 Tecom LLC
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { FC, PropsWithChildren } from "react";

export const SimpleWrapper: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className="simple-wrapper" data-testid="simple-wrapper">
            {children}
        </div>
    );
};
