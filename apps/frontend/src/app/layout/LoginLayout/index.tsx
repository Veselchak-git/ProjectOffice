/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { FC, PropsWithChildren } from "react";

export const LoginLayout: FC<PropsWithChildren> = ({ children }) => {
    return <div className="login-layout">{children}</div>;
};
