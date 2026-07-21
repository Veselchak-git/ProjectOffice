/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { type FC, type ReactNode } from "react";

import { useAuditLogStream, type AuditLogSseEvent } from "@/shared/lib/sse";

import { SSEContext } from "./SSEContext";

interface SSEProviderProps {
    children: ReactNode;
    enabled?: boolean;
    onAuditLogEvent?: (event: AuditLogSseEvent) => void;
}

export const SSEProvider: FC<SSEProviderProps> = ({ children, enabled = true, onAuditLogEvent }) => {
    const handleEvent = (event: AuditLogSseEvent) => {
        if (event.type === "connected") {
            // Connection established
            return;
        }

        if (onAuditLogEvent) {
            onAuditLogEvent(event);
        }
    };

    useAuditLogStream(handleEvent, enabled);

    return <SSEContext.Provider value={{ isConnected: enabled }}>{children}</SSEContext.Provider>;
};
