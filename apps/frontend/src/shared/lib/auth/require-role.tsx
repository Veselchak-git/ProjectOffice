import type { FC, PropsWithChildren } from "react";
import { Navigate } from "react-router";

import { useAuth } from "./auth-context";

interface RequireRoleProps {
    roles: string[];
}

export const RequireRole: FC<PropsWithChildren<RequireRoleProps>> = ({ roles, children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
