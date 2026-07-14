export const NS = {
    common: "common",
    auth: "auth",
    navigation: "navigation",
    users: "users",
    projects: "projects",
    issues: "issues",
    audit: "audit",
    validation: "validation",
} as const;

export type Namespace = (typeof NS)[keyof typeof NS];

export const ALL_NAMESPACES = Object.values(NS) as Namespace[];
