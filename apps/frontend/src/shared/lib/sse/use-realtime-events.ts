/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useAuditLogStream } from "./use-audit-log-stream";
import type { AuditLogSseEvent } from "./use-audit-log-stream";

/**
 * Mapping of SSE event types to query key strings.
 * When an event with a matching type arrives, the corresponding
 * query keys are invalidated via react-query.
 */
type EventMap = Record<string, string[]>;

/**
 * Hook that wraps useAuditLogStream and provides automatic
 * react-query cache invalidation based on SSE event types.
 *
 * @param eventMap - mapping of event.type → queryKey strings to invalidate
 */
export function useRealtimeEvents(eventMap: EventMap) {
    const queryClient = useQueryClient();

    const handleEvent = useCallback(
        (event: AuditLogSseEvent) => {
            const queryKeys = eventMap[event.type];
            if (queryKeys) {
                for (const queryKey of queryKeys) {
                    queryClient.invalidateQueries({ queryKey: [queryKey] });
                }
            }
        },
        [queryClient, eventMap]
    );

    useAuditLogStream(handleEvent);
}
