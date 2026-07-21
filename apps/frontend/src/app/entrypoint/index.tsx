/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { ErrorBoundary } from "@/shared/lib/error-boundary";

import { Providers } from "../providers";
import { routes } from "../router";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Providers>
            <ErrorBoundary>
                <RouterProvider router={routes} />
            </ErrorBoundary>
        </Providers>
    </StrictMode>
);
