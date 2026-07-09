import { createBrowserRouter, Navigate } from "react-router";

import { BaseLayout, LoginLayout } from "../layout";

export const routes = createBrowserRouter([
    {
        path: "/",
        element: <BaseLayout />,
        children: [
            {
                index: true,
                element: <Navigate to="/projects" replace />,
            },
            {
                path: "projects",
                lazy: async () => {
                    const { ProjectsPage } = await import("@/pages/projects-page");
                    return { Component: ProjectsPage };
                },
            },
            {
                path: "projects/:id",
                lazy: async () => {
                    const { ProjectPage } = await import("@/pages/project-page");
                    return { Component: ProjectPage };
                },
            },
            {
                path: "tasks",
                lazy: async () => {
                    const { HomePage } = await import("@/pages/home-page");
                    return { Component: HomePage };
                },
            },
            {
                path: "audit-log",
                lazy: async () => {
                    const { HomePage } = await import("@/pages/home-page");
                    return { Component: HomePage };
                },
            },
            {
                path: "users",
                lazy: async () => {
                    const { UsersPage } = await import("@/pages/users-page");
                    return { Component: UsersPage };
                },
            },
            {
                path: "profile",
                lazy: async () => {
                    const { ProfilePage } = await import("@/pages/profile-page");
                    return { Component: ProfilePage };
                },
            },
        ],
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
                },
            },
        ],
    },
]);
