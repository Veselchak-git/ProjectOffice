/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { isRouteErrorResponse, useRouteError } from "react-router";

export function ErrorElement() {
    const error = useRouteError();

    if (isRouteErrorResponse(error)) {
        return (
            <div style={{ padding: "2rem", textAlign: "center" }}>
                <h2>
                    {error.status} {error.statusText}
                </h2>
                <p>{error.data?.message ?? "An error occurred"}</p>
            </div>
        );
    }

    return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
            <h2>Something went wrong</h2>
            <p>{error instanceof Error ? error.message : "An error occurred"}</p>
        </div>
    );
}
