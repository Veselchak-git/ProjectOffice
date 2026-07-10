export interface User {
    id: number;
    login: string;
    role: "GUEST" | "PROJECT_MANAGER" | "ADMIN";
    createdAt: string;
}

export interface CreateUserData {
    login: string;
    password: string;
    role: "GUEST" | "PROJECT_MANAGER" | "ADMIN";
}

export interface UpdateUserRoleData {
    role: "GUEST" | "PROJECT_MANAGER" | "ADMIN";
}
