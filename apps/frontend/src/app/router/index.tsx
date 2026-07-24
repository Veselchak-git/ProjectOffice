/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { createBrowserRouter, redirect } from "react-router";

import { store } from "@/app/store";

import { selectAuthLoading, selectAuthUser } from "@/shared/lib/auth/auth-slice";
import { ErrorElement } from "@/shared/lib/error-boundary/error-element";

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

async function isAuth() {
    await waitForAuth();
    return !!selectAuthUser(store.getState());
}

function requireAuth() {
    return isAuth().then(auth => {
        if (!auth) throw redirect("/login");
    });
}

function requireRole(roles: string[]) {
    return isAuth().then(auth => {
        if (!auth) throw redirect("/login");
        const user = selectAuthUser(store.getState());
        if (!user || !roles.includes(user.role)) {
            throw redirect("/");
        }
    });
}

export const routes = createBrowserRouter([
    {
        path: "/",
        element: <BaseLayout />,
        errorElement: <ErrorElement />,
        children: [
            {
                index: true,
                lazy: async () => {
                    const { HomePage } = await import("@/pages/home-page");
                    return { Component: HomePage };
                },
                errorElement: <ErrorElement />
            },
            {
                path: "projects",
                lazy: async () => {
                    const { ProjectsPage } = await import("@/pages/projects-page");
                    return { Component: ProjectsPage };
                },
                loader: requireAuth,
                errorElement: <ErrorElement />
            },
            {
                path: "projects/:id",
                lazy: async () => {
                    const { ProjectPage } = await import("@/pages/project-page");
                    return { Component: ProjectPage };
                },
                loader: requireAuth,
                errorElement: <ErrorElement />
            },
            {
                path: "tasks",
                lazy: async () => {
                    const { IssuesPage } = await import("@/pages/issues-page");
                    return { Component: IssuesPage };
                },
                loader: requireAuth,
                errorElement: <ErrorElement />
            },
            {
                path: "tasks/:id",
                lazy: async () => {
                    const { IssuePage } = await import("@/pages/issue-page");
                    return { Component: IssuePage };
                },
                loader: requireAuth,
                errorElement: <ErrorElement />
            },
            {
                path: "audit-log",
                lazy: async () => {
                    const { AuditLogPage } = await import("@/pages/audit-log-page");
                    return { Component: AuditLogPage };
                },
                loader: requireAuth,
                errorElement: <ErrorElement />
            },
            {
                path: "users",
                lazy: async () => {
                    const { UsersPage } = await import("@/pages/users-page");
                    return { Component: UsersPage };
                },
                loader: () => requireRole(["ADMIN"]),
                errorElement: <ErrorElement />
            },
            {
                path: "profile",
                lazy: async () => {
                    const { ProfilePage } = await import("@/pages/profile-page");
                    return { Component: ProfilePage };
                },
                loader: requireAuth,
                errorElement: <ErrorElement />
            }
        ]
    },
    {
        path: "/login",
        element: <LoginLayout />,
        loader: isAuth,
        errorElement: <ErrorElement />,
        children: [
            {
                index: true,
                lazy: async () => {
                    const { LoginPage } = await import("@/pages/login-page");
                    return { Component: LoginPage };
                },
                errorElement: <ErrorElement />
            }
        ]
    }
]);
