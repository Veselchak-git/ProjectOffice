import type { FC, PropsWithChildren } from "react";
import { Navigate } from "react-router";

import type { UserRole } from "./auth-slice";
import { RequireAuth } from "./require-auth";
import { useAuth } from "./use-auth";

interface RequireRoleProps {
    roles: UserRole[];
}

const RoleGuard: FC<PropsWithChildren<RequireRoleProps>> = ({ roles, children }) => {
    const { user } = useAuth();

    if (!user || !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export const RequireRole: FC<PropsWithChildren<RequireRoleProps>> = ({ roles, children }) => (
    <RequireAuth>
        <RoleGuard roles={roles}>{children}</RoleGuard>
    </RequireAuth>
);
