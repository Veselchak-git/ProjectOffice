import ArchiveIcon from "@helpdesk-portal/icons/Archive.svg?react";
import FolderIcon from "@helpdesk-portal/icons/Folder.svg?react";
import HouseIcon from "@helpdesk-portal/icons/House.svg?react";
import ListChecksIcon from "@helpdesk-portal/icons/ListChecks.svg?react";
import MoonIcon from "@helpdesk-portal/icons/Moon.svg?react";
import ResetInputIcon from "@helpdesk-portal/icons/ResetInput.svg?react";
import SunIcon from "@helpdesk-portal/icons/Sun.svg?react";
import TecomLogoIcon from "@helpdesk-portal/icons/TecomLogo.svg?react";
import UserIcon from "@helpdesk-portal/icons/User.svg?react";
import { useColorMode } from "@helpdesk-portal/ui-kit";
import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import "./BaseLayout.css";

interface MenuItem {
    label: string;
    path: string;
    icon: FC;
}

const menuItems: MenuItem[] = [
    { label: "Главная", path: "/", icon: HouseIcon },
    { label: "Проекты", path: "/projects", icon: FolderIcon },
    { label: "Задачи", path: "/tasks", icon: ListChecksIcon },
    { label: "Аудит-лог", path: "/audit-log", icon: ArchiveIcon },
    { label: "Пользователи", path: "/users", icon: UserIcon },
];

export const BaseLayout: FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { mode, toggleMode } = useColorMode();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const handleLogout = useCallback(() => {
        localStorage.removeItem("accessToken");
        navigate("/login", { replace: true });
    }, [navigate]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="base-layout">
            <aside className={`sidebar${sidebarOpen ? "" : " sidebar--closed"}`}>
                <div className="sidebar__logo">
                    <button className="sidebar__logo-icon" type="button" aria-label="Toggle menu" onClick={() => setSidebarOpen(v => !v)}>
                        {sidebarOpen ? <ResetInputIcon /> : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 7H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                <path d="M4 12H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                <path d="M4 17H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                        )}
                    </button>
                    {sidebarOpen && (
                        <div className="sidebar__logo-img">
                            <TecomLogoIcon />
                        </div>
                    )}
                </div>

                <nav className="sidebar__nav">
                    {menuItems.map((item, idx) => {
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
                                {sidebarOpen && <span className="sidebar__item-text">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar__divider" />
            </aside>

            <div className="content-area">
                <header className="header">
                    <div className="header__right">
                        <div className="header__theme-switch">
                            <SunIcon />
                            <label className="theme-switch">
                                <input type="checkbox" checked={mode === "dark"} onChange={toggleMode} />
                                <span className="theme-switch__slider" />
                            </label>
                            <MoonIcon />
                        </div>
                        <div className="header__divider" />
                        <div className="header__profile-wrapper" ref={profileRef}>
                            <button className="header__profile-btn" type="button" onClick={() => setProfileMenuOpen(v => !v)}>
                                <div className="header__avatar">
                                    <UserIcon />
                                </div>
                                <div className="header__user">
                                    <span className="header__user-name">Иванов И.</span>
                                    <span className="header__user-role">Администратор</span>
                                </div>
                            </button>
                            {profileMenuOpen && (
                                <div className="header__profile-menu">
                                    <button className="header__profile-menu-item" type="button" onClick={() => { navigate("/profile"); setProfileMenuOpen(false); }}>
                                        Редактировать
                                    </button>
                                    <button className="header__profile-menu-item header__profile-menu-item--danger" type="button" onClick={handleLogout}>
                                        Выйти
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
    );
};
