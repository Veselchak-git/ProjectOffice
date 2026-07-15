/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { UiKitThemeProvider } from "@helpdesk-portal/ui-kit";
import type { FC, PropsWithChildren } from "react";

import { I18nProvider } from "./I18nProvider";
import { QueryProvider } from "./Query";
import { ReduxProvider } from "./Redux";

export const Providers: FC<PropsWithChildren> = ({ children }) => {
    return (
        <QueryProvider>
            <ReduxProvider>
                <UiKitThemeProvider>
                    <I18nProvider>{children}</I18nProvider>
                </UiKitThemeProvider>
            </ReduxProvider>
        </QueryProvider>
    );
};
