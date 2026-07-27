import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

export interface UseDynamicPerPageOptions {
    rowHeight: number;
    theadHeight: number;
    paginationHeight: number;
    min?: number;
    debounceMs?: number;
}

export interface UseDynamicPerPageResult {
    perPage: number;
    ready: boolean;
}

export function useDynamicPerPage(
    containerRef: RefObject<HTMLDivElement | null>,
    options: UseDynamicPerPageOptions
): UseDynamicPerPageResult {
    const { rowHeight, theadHeight, paginationHeight, min = 5, debounceMs = 200 } = options;
    const [perPage, setPerPage] = useState(min);
    const [ready, setReady] = useState(false);
    const readyRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const calc = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const available = window.innerHeight - rect.top - paginationHeight - theadHeight;
        const rows = Math.max(min, Math.floor(available / rowHeight));
        setPerPage(rows);

        if (!readyRef.current) {
            readyRef.current = true;
            setReady(true);
        }
    }, [containerRef, rowHeight, theadHeight, paginationHeight, min]);

    useEffect(() => {
        calc();

        const onResize = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(calc, debounceMs);
        };

        window.addEventListener("resize", onResize);

        // Observe container size changes (e.g. when filter chips appear/disappear
        // push the table area up/down, changing rect.top and available height).
        const observer = new ResizeObserver(onResize);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener("resize", onResize);
            observer.disconnect();
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [calc, debounceMs, containerRef]);

    return { perPage, ready };
}
