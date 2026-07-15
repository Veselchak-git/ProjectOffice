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

export async function handleApiResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
    if (!res.ok) {
        const body: ApiErrorBody | null = await res.json().catch(() => null);
        const error = new Error(body?.message ?? fallbackMessage);
        if (body?.code) {
            (error as Error & { code: string }).code = body.code;
        }
        throw error;
    }
    return res.json();
}
