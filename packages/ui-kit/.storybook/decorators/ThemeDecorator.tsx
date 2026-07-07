/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { Decorator } from "@storybook/react-vite";
import React, { useEffect } from "react";

import { type ColorMode, UiKitThemeProvider, useColorMode } from "../../src/theme";

const ThemeSync: React.FC<{ themeMode: ColorMode }> = ({ themeMode }) => {
    const { setMode } = useColorMode();

    useEffect(() => {
        if (themeMode && ["light", "dark"].includes(themeMode)) {
            setMode(themeMode);
        }
    }, [themeMode, setMode]);

    return null;
};

export const ThemeDecorator: Decorator = (Story, context) => {
    const themeMode = context.globals.theme;

    return (
        <UiKitThemeProvider>
            <ThemeSync themeMode={themeMode} />
            <Story />
        </UiKitThemeProvider>
    );
};
