/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { FC } from "react";
import { Outlet } from "react-router";

export const LoginLayout: FC = () => {
    return (
        <div className="login-layout">
            <div className="login-card">
                <Outlet />
            </div>
        </div>
    );
};
