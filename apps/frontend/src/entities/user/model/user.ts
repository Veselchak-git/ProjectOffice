export interface User {
    id: number;
    login: string;
    role: "GUEST" | "USER" | "ADMIN";
    createdAt: string;
}

export interface CreateUserData {
    login: string;
    password: string;
    role: "GUEST" | "USER" | "ADMIN";
}

export interface UpdateUserData {
    login?: string;
    password?: string;
    role?: "GUEST" | "USER" | "ADMIN";
}

export interface FetchUsersParams {
    q?: string;
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface FetchUsersResponse {
    users: User[];
    total: number;
    page: number;
    perPage: number;
}
