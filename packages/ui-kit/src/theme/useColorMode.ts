/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { createContext, useContext, useEffect, useState } from "react";

export type ColorMode = "light" | "dark";

interface ColorModeContextValue {
    mode: ColorMode;
    toggleMode: () => void;
    setMode: (mode: ColorMode) => void;
}

export const ColorModeContext = createContext<ColorModeContextValue>({
    mode: "light",
    toggleMode: () => {},
    setMode: () => {}
});

const STORAGE_KEY = "ui-kit-color-mode";

const getSystemMode = (): ColorMode => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

const getInitialMode = (): ColorMode => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return getSystemMode();
};

export const useColorModeState = (): ColorModeContextValue => {
    const [mode, setModeState] = useState<ColorMode>(getInitialMode);

    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                setModeState(e.matches ? "dark" : "light");
            }
        };
        media.addEventListener("change", handler);
        return () => media.removeEventListener("change", handler);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-color-mode", mode);
        localStorage.setItem(STORAGE_KEY, mode);
    }, [mode]);

    const toggleMode = () => setModeState(prev => (prev === "light" ? "dark" : "light"));
    const setMode = (next: ColorMode) => setModeState(next);

    return { mode, toggleMode, setMode };
};

export const useColorMode = (): ColorModeContextValue => useContext(ColorModeContext);
