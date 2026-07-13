/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { UiKitThemeProvider } from "@helpdesk-portal/ui-kit";
import type { FC, PropsWithChildren } from "react";

import { AuthProvider } from "@/shared/lib/auth";

import { FakeProviderWithValue } from "./FakeProviderWithValue";
import { QueryProvider } from "./Query";
import { ReduxProvider } from "./Redux";
import { I18nProvider } from "./i18n-provider";

export const Providers: FC<PropsWithChildren> = ({ children }) => {
    return (
        <QueryProvider>
            <ReduxProvider>
                <AuthProvider>
                    <UiKitThemeProvider>
                        <FakeProviderWithValue>
                            <I18nProvider>{children}</I18nProvider>
                        </FakeProviderWithValue>
                    </UiKitThemeProvider>
                </AuthProvider>
            </ReduxProvider>
        </QueryProvider>
    );
};
