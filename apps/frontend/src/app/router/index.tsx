/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { createBrowserRouter } from "react-router";

import { BaseLayout } from "../layout";

export const routes = createBrowserRouter([
    {
        path: "/",
        element: <BaseLayout />,
        children: [
            {
                path: "/",
                lazy: async () => {
                    const { HomePage } = await import("@/pages/HomePage");
                    return {
                        Component: HomePage
                    };
                }
            }
        ]
    }
]);
