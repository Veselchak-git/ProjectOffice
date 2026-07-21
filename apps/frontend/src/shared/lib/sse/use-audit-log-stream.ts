/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { useEffect, useRef, useCallback } from "react";

import { getToken } from "@/shared/lib/auth/token-store";

export interface AuditLogSseEvent {
    type: string;
    id?: number;
    eventType?: string;
    subjectType?: string;
    objectType?: string;
    subjectId?: number;
    objectId?: number;
    oldValue?: string | null;
    newValue?: string | null;
    subjectLogin?: string;
    createdAt?: string;
    message?: string;
}

type EventCallback = (event: AuditLogSseEvent) => void;

/**
 * Hook for connecting to the audit-log SSE stream.
 * Uses browser's EventSource API which handles reconnection automatically.
 *
 * EventSource doesn't support custom headers (like Authorization).
 * JWT is passed as a query parameter (?token=...) and verified server-side.
 */
export function useAuditLogStream(onEvent: EventCallback, enabled = true) {
    const eventSourceRef = useRef<EventSource | null>(null);
    const onEventRef = useRef(onEvent);

    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    const connect = useCallback(() => {
        if (!enabled) return;

        // Close existing connection if any
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const token = getToken();
        const url = token
            ? `/api/audit-log/stream?token=${encodeURIComponent(token)}`
            : "/api/audit-log/stream";
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event: MessageEvent) => {
            try {
                const data: AuditLogSseEvent = JSON.parse(event.data);
                onEventRef.current(data);
            } catch {
                // Ignore malformed events
            }
        };

        eventSource.onerror = () => {
            // EventSource automatically reconnects
            // The browser will retry with exponential backoff
        };

        eventSourceRef.current = eventSource;
    }, [enabled]);

    useEffect(() => {
        connect();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [connect]);

    return {
        disconnect: () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        }
    };
}
