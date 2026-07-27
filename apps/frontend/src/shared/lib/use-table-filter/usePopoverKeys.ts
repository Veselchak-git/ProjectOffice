import { useCallback, useState } from "react";

export function usePopoverKeys() {
    const [popoverKeys, setPopoverKeys] = useState<Record<string, number>>({});

    const bumpKey = useCallback((field: string) => {
        setPopoverKeys(prev => ({ ...prev, [field]: (prev[field] ?? 0) + 1 }));
    }, []);

    return { popoverKeys, bumpKey };
}
