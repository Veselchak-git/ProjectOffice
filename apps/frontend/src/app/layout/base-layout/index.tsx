/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
/*NAVIGATION
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { COMMON, NAVIGATION } from "@helpdesk-portal/i18n";
import ArchiveIcon from "@helpdesk-portal/icons/Archive.svg?react";
import FolderIcon from "@helpdesk-portal/icons/Folder.svg?react";
import HouseIcon from "@helpdesk-portal/icons/House.svg?react";
import ListChecksIcon from "@helpdesk-portal/icons/ListChecks.svg?react";
import MoonIcon from "@helpdesk-portal/icons/Moon.svg?react";
import ResetInputIcon from "@helpdesk-portal/icons/ResetInput.svg?react";
import SunIcon from "@helpdesk-portal/icons/Sun.svg?react";
import TecomLogoIcon from "@helpdesk-portal/icons/TecomLogo.svg?react";
import UserIcon from "@helpdesk-portal/icons/User.svg?react";
import { Select, useColorMode } from "@helpdesk-portal/ui-kit";
import { useQuery } from "@tanstack/react-query";
import { type FC, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router";

import { RequireAuth, apiClient, useAuth } from "@/shared/lib/auth";
import type { UserRole } from "@/shared/lib/auth";
import { i18n } from "@/shared/lib/i18n";
import { useClickOutside } from "@/shared/lib/use-click-outside";

import "./BaseLayout.css";

interface MenuItem {
    label: string;
    path: string;
    icon: FC;
    roles?: UserRole[];
}

const menuItems: MenuItem[] = [
    { label: `${NAVIGATION}:menu.home`, path: "/", icon: HouseIcon },
    { label: `${NAVIGATION}:menu.projects`, path: "/projects", icon: FolderIcon, roles: ["ADMIN", "USER"] },
    { label: `${NAVIGATION}:menu.tasks`, path: "/tasks", icon: ListChecksIcon, roles: ["ADMIN", "USER"] },
    { label: `${NAVIGATION}:menu.audit-log`, path: "/audit-log", icon: ArchiveIcon, roles: ["ADMIN", "USER"] },
    { label: `${NAVIGATION}:menu.users`, path: "/users", icon: UserIcon, roles: ["ADMIN"] }
];

export const BaseLayout: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { mode, toggleMode } = useColorMode();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const roleLabels: Record<string, string> = {
        ADMIN: t(`${NAVIGATION}:role.admin`),
        USER: t(`${NAVIGATION}:role.user`),
        GUEST: t(`${NAVIGATION}:role.guest`)
    };

    const handleLogout = useCallback(async () => {
        await logout();
        navigate("/login", { replace: true });
    }, [logout, navigate]);

    useClickOutside(profileRef, () => setProfileMenuOpen(false));

    const { data: auditLogData } = useQuery({
        queryKey: ["audit-log-available"],
        queryFn: () => apiClient("/api/audit-log/available").then(r => r.json()),
        enabled: user?.role === "USER",
        staleTime: 0
    });

    const auditLogAvailable = user?.role === "ADMIN" || (auditLogData?.available ?? false);

    const visibleItems = menuItems.filter(item => {
        if (!item.roles) return true;
        if (!user) return false;
        if (!item.roles.includes(user.role)) return false;
        if (item.path === "/audit-log" && !auditLogAvailable) return false;
        return true;
    });

    const displayName = user?.login?.split("@")[0] ?? t(`${NAVIGATION}:role.user`);
    const displayRole = user ? (roleLabels[user.role] ?? user.role) : "";

    return (
        <RequireAuth>
            <div className="base-layout">
                <aside className={`sidebar${sidebarOpen ? "" : " sidebar--closed"}`}>
                    <div className="sidebar__logo">
                        <button
                            className="sidebar__logo-icon"
                            type="button"
                            aria-label="Toggle menu"
                            onClick={() => setSidebarOpen(v => !v)}
                        >
                            {sidebarOpen ? (
                                <ResetInputIcon />
                            ) : (
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M4 7H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                                    <path
                                        d="M4 12H20"
                                        stroke="currentColor"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                    />
                                    <path
                                        d="M4 17H20"
                                        stroke="currentColor"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>

                    <nav className="sidebar__nav">
                        {visibleItems.map((item, idx) => {
                            const IconComponent = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <button
                                    key={idx}
                                    className={`sidebar__item${isActive ? " sidebar__item--active" : ""}`}
                                    type="button"
                                    onClick={() => navigate(item.path)}
                                >
                                    <span className="sidebar__item-icon">
                                        <IconComponent />
                                    </span>
                                    {sidebarOpen && <span className="sidebar__item-text">{t(item.label)}</span>}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="sidebar__divider" />
                </aside>

                <div className="content-area">
                    <header className="header">
                        <div className="header__logo">
                            <TecomLogoIcon />
                        </div>
                        <div className="header__right">
                            <div className="header__theme-switch">
                                <SunIcon />
                                <label className="theme-switch">
                                    <input type="checkbox" checked={mode === "dark"} onChange={toggleMode} />
                                    <span className="theme-switch__slider" />
                                </label>
                                <MoonIcon />
                            </div>
                            <div className="header__locale-switch">
                                <Select
                                    options={[
                                        { value: "ru", label: "RU" },
                                        { value: "en", label: "EN" }
                                    ]}
                                    value={i18n.language}
                                    onValueChange={val => i18n.changeLanguage(val)}
                                />
                            </div>
                            <div className="header__divider" />
                            <div className="header__profile-wrapper" ref={profileRef}>
                                <button
                                    className="header__profile-btn"
                                    type="button"
                                    onClick={() => setProfileMenuOpen(v => !v)}
                                >
                                    <div className="header__avatar">
                                        <UserIcon />
                                    </div>
                                    <div className="header__user">
                                        <span className="header__user-name">{displayName}</span>
                                        <span className="header__user-role">{displayRole}</span>
                                    </div>
                                </button>
                                {profileMenuOpen && (
                                    <div className="header__profile-menu">
                                        <button
                                            className="header__profile-menu-item"
                                            type="button"
                                            onClick={() => {
                                                navigate("/profile");
                                                setProfileMenuOpen(false);
                                            }}
                                        >
                                            {t(`${COMMON}:edit`)}
                                        </button>
                                        <button
                                            className="header__profile-menu-item header__profile-menu-item--danger"
                                            type="button"
                                            onClick={handleLogout}
                                        >
                                            {t(`${COMMON}:logout`)}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <main className="content">
                        <Outlet />
                    </main>
                </div>
            </div>
        </RequireAuth>
    );
};
