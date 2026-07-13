import { createBrowserRouter } from "react-router";

import { BaseLayout, LoginLayout } from "../layout";

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
                    const { RequireRole } = await import("@/shared/lib/auth");
                    return {
                        Component: () => (
                            <RequireRole roles={["ADMIN", "USER"]}>
                                <ProjectsPage />
                            </RequireRole>
                        )
                    };
                }
            },
            {
                path: "projects/:id",
                lazy: async () => {
                    const { ProjectPage } = await import("@/pages/project-page");
                    const { RequireRole } = await import("@/shared/lib/auth");
                    return {
                        Component: () => (
                            <RequireRole roles={["ADMIN", "USER"]}>
                                <ProjectPage />
                            </RequireRole>
                        )
                    };
                }
            },
            {
                path: "tasks",
                lazy: async () => {
                    const { HomePage } = await import("@/pages/home-page");
                    const { RequireRole } = await import("@/shared/lib/auth");
                    return {
                        Component: () => (
                            <RequireRole roles={["ADMIN", "USER"]}>
                                <HomePage />
                            </RequireRole>
                        )
                    };
                }
            },
            {
                path: "audit-log",
                lazy: async () => {
                    const { HomePage } = await import("@/pages/home-page");
                    const { RequireRole } = await import("@/shared/lib/auth");
                    return {
                        Component: () => (
                            <RequireRole roles={["ADMIN", "USER"]}>
                                <HomePage />
                            </RequireRole>
                        )
                    };
                }
            },
            {
                path: "users",
                lazy: async () => {
                    const { UsersPage } = await import("@/pages/users-page");
                    const { RequireRole } = await import("@/shared/lib/auth");
                    return {
                        Component: () => (
                            <RequireRole roles={["ADMIN"]}>
                                <UsersPage />
                            </RequireRole>
                        )
                    };
                }
            },
            {
                path: "profile",
                lazy: async () => {
                    const { ProfilePage } = await import("@/pages/profile-page");
                    const { RequireRole } = await import("@/shared/lib/auth");
                    return {
                        Component: () => (
                            <RequireRole roles={["ADMIN", "USER"]}>
                                <ProfilePage />
                            </RequireRole>
                        )
                    };
                }
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
