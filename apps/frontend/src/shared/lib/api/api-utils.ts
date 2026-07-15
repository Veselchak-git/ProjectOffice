export interface PaginationParams {
    q?: string;
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface ApiErrorBody {
    code?: string;
    message?: string;
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
