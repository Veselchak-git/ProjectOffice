import { i18n } from "@/shared/lib/i18n";

export interface ApiErrorBody {
    code?: string;
    message?: string;
}

export interface PaginationQueryParams {
    q?: string;
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export function buildQueryString(params?: Record<string, string | number | null | undefined> | object): string {
    if (!params) return "";

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
        if (value === undefined || value === null || value === "") continue;
        searchParams.set(key, String(value));
    }

    const query = searchParams.toString();
    return query ? `?${query}` : "";
}

export async function handleApiResponse<T>(res: Response, namespace: string, fallbackKey: string): Promise<T> {
    if (!res.ok) {
        const body: ApiErrorBody | null = await res.json().catch(() => null);
        const code = body?.code;

        let message: string | undefined;
        if (code) {
            const localized = i18n.t(`${namespace}:error.${code}`);
            if (localized !== `${namespace}:error.${code}`) {
                message = localized;
            }
        }
        if (!message) {
            message = i18n.t(`${namespace}:${fallbackKey}`);
        }
        if (!message || message === `${namespace}:${fallbackKey}`) {
            message = "Error";
        }

        const error = new Error(message);
        if (code) {
            (error as Error & { code: string }).code = code;
        }
        throw error;
    }
    return res.json();
}
