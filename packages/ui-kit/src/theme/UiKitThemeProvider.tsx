/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { type FC, type PropsWithChildren } from "react";

import { ColorModeContext, useColorModeState } from "./useColorMode";

export const UiKitThemeProvider: FC<PropsWithChildren> = ({ children }) => {
    const value = useColorModeState();
    return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
};
