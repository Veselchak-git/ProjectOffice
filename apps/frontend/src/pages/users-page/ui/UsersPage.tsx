import { useEffect, type FC } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "@/shared/lib/auth/auth-context";

export const UsersPage: FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.role !== "ADMIN") {
            navigate("/projects", { replace: true });
        }
    }, [user, navigate]);

    if (!user || user.role !== "ADMIN") return null;

    return <div className="users-page" />;
};
