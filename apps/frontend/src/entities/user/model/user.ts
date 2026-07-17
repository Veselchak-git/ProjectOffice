import type { PaginationQueryParams } from "@/shared/lib/api";

export interface User {
    id: number;
    login: string;
    role: "USER" | "ADMIN";
    createdAt: string;
}

export interface CreateUserData {
    login: string;
    password: string;
    role: "USER" | "ADMIN";
}

export interface UpdateUserData {
    login?: string;
    password?: string;
    role?: "USER" | "ADMIN";
}

export type FetchUsersParams = PaginationQueryParams;

export interface FetchUsersResponse {
    users: User[];
    total: number;
    page: number;
    perPage: number;
}
