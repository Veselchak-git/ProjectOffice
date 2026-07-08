/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { useColorMode } from "@helpdesk-portal/ui-kit";
import type { FC } from "react";
import { Outlet } from "react-router";

export const LoginLayout: FC = () => {
    const { mode, toggleMode } = useColorMode();

    return (
        <div className="login-layout">
            <button className="theme-toggle" onClick={toggleMode} type="button">
                {mode === "light" ? "🌙" : "☀️"}
            </button>
            <div className="login-card">
                <Outlet />
            </div>
        </div>
    );
};
