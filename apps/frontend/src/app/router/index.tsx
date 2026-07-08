/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { createBrowserRouter } from "react-router";

import { BaseLayout, LoginLayout } from "../layout";

export const routes = createBrowserRouter([
    {
        path: "/",
        element: <BaseLayout />,
        children: [
            {
                path: "/",
                lazy: async () => {
                    const { HomePage } = await import("@/pages/home-page");
                    return {
                        Component: HomePage
                    };
                }
            }
        ]
    },
    {
        path: "/login",
        element: <LoginLayout />,
        children: [
            {
                index: true,
                lazy: async () => {
                    const { LoginPage } = await import("@/pages/login-page");
                    return { Component: LoginPage };
                }
            }
        ]
    }
]);
