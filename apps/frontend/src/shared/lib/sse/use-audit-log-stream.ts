/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { useCallback, useEffect, useRef } from "react";

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
}

type EventCallback = (event: AuditLogSseEvent) => void;

/**
 * Hook for connecting to the audit-log SSE stream.
 * Uses fetch API with ReadableStream to support Authorization header.
 *
 * JWT is passed in the Authorization header as Bearer token.
 */
const MAX_RECONNECT_DELAY = 30_000;
const INITIAL_RECONNECT_DELAY = 1_000;

export function useAuditLogStream(onEvent: EventCallback, enabled = true) {
    const abortControllerRef = useRef<AbortController | null>(null);
    const onEventRef = useRef(onEvent);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);

    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    const connectRef = useRef<() => void>(() => {});

    const connect = useCallback(async () => {
        if (!enabled) return;

        // Close existing connection if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        const token = getToken();
        if (!token) {
            // No token available, retry after delay
            reconnectTimeoutRef.current = setTimeout(connectRef.current, reconnectDelayRef.current);
            reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, MAX_RECONNECT_DELAY);
            return;
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const response = await fetch("/api/audit-log/stream", {
                method: "GET",
                headers: {
                    Accept: "text/event-stream",
                    "Cache-Control": "no-cache",
                    Authorization: `Bearer ${token}`
                },
                signal: abortController.signal
            });

            if (!response.ok) {
                // Server returned error, retry after delay
                reconnectTimeoutRef.current = setTimeout(connectRef.current, reconnectDelayRef.current);
                reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, MAX_RECONNECT_DELAY);
                return;
            }

            const reader = response.body?.getReader();
            if (!reader) {
                reconnectTimeoutRef.current = setTimeout(connectRef.current, reconnectDelayRef.current);
                reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, MAX_RECONNECT_DELAY);
                return;
            }

            // Connected successfully — reset backoff
            reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trimEnd();

                    // Skip empty lines and comments (heartbeats)
                    if (trimmed === "" || trimmed.startsWith(":")) {
                        continue;
                    }

                    // Parse data lines
                    if (trimmed.startsWith("data: ")) {
                        const jsonStr = trimmed.slice(6);
                        try {
                            const data: AuditLogSseEvent = JSON.parse(jsonStr);
                            onEventRef.current(data);
                        } catch {
                            // Ignore malformed events
                        }
                    }
                }
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                // Connection was intentionally aborted
                return;
            }
            // Other errors, retry after delay
        }

        // Auto-reconnect after disconnect with exponential backoff
        if (!abortController.signal.aborted) {
            reconnectTimeoutRef.current = setTimeout(connectRef.current, reconnectDelayRef.current);
            reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, MAX_RECONNECT_DELAY);
        }
    }, [enabled]);

    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    useEffect(() => {
        connect();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, [connect]);

    return {
        disconnect: () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        }
    };
}
