export function formatDate(isoString: string): string {
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    } catch {
        return isoString;
    }
}

export function formatDateTime(isoString: string): string {
    try {
        const date = new Date(isoString);
        return date.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return isoString;
    }
}
