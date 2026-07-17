import { createBrowserRouter, redirect } from "react-router";

import { store } from "@/app/store";

import { selectAuthLoading, selectAuthUser } from "@/shared/lib/auth/auth-slice";

import { BaseLayout, LoginLayout } from "../layout";

async function waitForAuth() {
    if (!selectAuthLoading(store.getState())) return;
    return new Promise<void>(resolve => {
        const unsubscribe = store.subscribe(() => {
            if (!selectAuthLoading(store.getState())) {
                unsubscribe();
                resolve();
            }
        });
    });
}

async function requireAuth() {
    await waitForAuth();
    if (!selectAuthUser(store.getState())) {
        throw redirect("/login");
    }
    return null;
}

async function requireRole(roles: string[]) {
    await requireAuth();
    const user = selectAuthUser(store.getState());
    if (!user || !roles.includes(user.role)) {
        throw redirect("/");
    }
    return null;
}

export const routes = createBrowserRouter([
    {
        path: "/",
        element: <BaseLayout />,
        children: [
            {
                index: true,
                lazy: async () => {
                    const { HomePage } = await import("@/pages/home-page");
                    return { Component: HomePage };
                }
            },
            {
                path: "projects",
                lazy: async () => {
                    const { ProjectsPage } = await import("@/pages/projects-page");
                    return { Component: ProjectsPage };
                },
                loader: () => requireRole(["ADMIN", "USER"])
            },
            {
                path: "projects/:id",
                lazy: async () => {
                    const { ProjectPage } = await import("@/pages/project-page");
                    return { Component: ProjectPage };
                },
                loader: () => requireRole(["ADMIN", "USER"])
            },
            {
                path: "tasks",
                lazy: async () => {
                    const { IssuesPage } = await import("@/pages/issues-page");
                    return { Component: IssuesPage };
                },
                loader: () => requireRole(["ADMIN", "USER"])
            },
            {
                path: "tasks/:id",
                lazy: async () => {
                    const { IssuePage } = await import("@/pages/issue-page");
                    return { Component: IssuePage };
                },
                loader: () => requireRole(["ADMIN", "USER"])
            },
            {
                path: "audit-log",
                lazy: async () => {
                    const { HomePage } = await import("@/pages/home-page");
                    return { Component: HomePage };
                },
                loader: () => requireRole(["ADMIN", "USER"])
            },
            {
                path: "users",
                lazy: async () => {
                    const { UsersPage } = await import("@/pages/users-page");
                    return { Component: UsersPage };
                },
                loader: () => requireRole(["ADMIN"])
            },
            {
                path: "profile",
                lazy: async () => {
                    const { ProfilePage } = await import("@/pages/profile-page");
                    return { Component: ProfilePage };
                },
                loader: () => requireRole(["ADMIN", "USER"])
            }
        ]
    },
    {
        path: "/login",
        element: <LoginLayout />,
        children: [
            {
                index: true,
                lazy: async () => {
                    const { LoginPage } = await import("@/pages/login-page");
                    return { Component: LoginPage };
                }
            }
        ]
    }
]);
