/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { type RefObject, useEffect, useEffectEvent } from "react";

export function useClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, enabled = true): void {
    const onOutsideEvent = useEffectEvent(onOutside);

    useEffect(() => {
        if (!enabled) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onOutsideEvent();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref, enabled]);
}
