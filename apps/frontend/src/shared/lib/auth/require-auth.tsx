import type { FC, PropsWithChildren } from "react";
import { Navigate } from "react-router";

import { useAuth } from "./auth-context";

export const RequireAuth: FC<PropsWithChildren> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
