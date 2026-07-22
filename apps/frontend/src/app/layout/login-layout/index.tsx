/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { FC } from "react";
import { Outlet } from "react-router";

import styles from "@/pages/login-page/ui/LoginPage.module.css";

export const LoginLayout: FC = () => {
    return (
        <div className={styles["login-layout"]}>
            <div className={styles["login-card"]}>
                <Outlet />
            </div>
        </div>
    );
};
