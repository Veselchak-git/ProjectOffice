import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRealtimeEvents } from "./use-realtime-events";

// Mock useAuditLogStream
let capturedCallback: ((event: { type: string }) => void) | null = null;

vi.mock("./use-audit-log-stream", () => ({
    useAuditLogStream: (cb: (event: { type: string }) => void) => {
        capturedCallback = cb;
    }
}));

describe("useRealtimeEvents", () => {
    beforeEach(() => {
        capturedCallback = null;
    });

    it("invalidates matching query keys when SSE event arrives", () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

        function Wrapper({ children }: { children: ReactNode }) {
            return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
        }

        renderHook(() => useRealtimeEvents({ "audit-log": ["audit-logs"] }), { wrapper: Wrapper });

        // Trigger SSE event
        capturedCallback?.({ type: "audit-log" });

        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["audit-logs"] });
    });

    it("does not invalidate for unmapped event types", () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

        function Wrapper({ children }: { children: ReactNode }) {
            return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
        }

        renderHook(() => useRealtimeEvents({ "audit-log": ["audit-logs"] }), { wrapper: Wrapper });

        // Trigger unmapped event
        capturedCallback?.({ type: "unknown" });

        expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it("invalidates multiple query keys for a single event type", () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

        function Wrapper({ children }: { children: ReactNode }) {
            return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
        }

        renderHook(() => useRealtimeEvents({ "audit-log": ["audit-logs", "projects"] }), { wrapper: Wrapper });

        capturedCallback?.({ type: "audit-log" });

        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["audit-logs"] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["projects"] });
    });
});
