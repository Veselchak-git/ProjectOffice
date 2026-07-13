import { type FC, type PropsWithChildren, useEffect, useState } from "react";

import { i18n, setLocale } from "@/shared/lib/i18n";
import type { Locale } from "@/shared/lib/i18n";
import { useAppDispatch } from "@/shared/lib/redux";

export const I18nProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useAppDispatch();
    const [ready, setReady] = useState(i18n.isInitialized);

    useEffect(() => {
        const handleLanguageChanged = (lng: string) => {
            dispatch(setLocale(lng as Locale));
        };

        i18n.on("languageChanged", handleLanguageChanged);

        const handleInitialized = () => {
            dispatch(setLocale(i18n.language as Locale));
            setReady(true);
        };

        if (i18n.isInitialized) {
            dispatch(setLocale(i18n.language as Locale));
        } else {
            i18n.on("initialized", handleInitialized);
        }

        return () => {
            i18n.off("languageChanged", handleLanguageChanged);
            i18n.off("initialized", handleInitialized);
        };
    }, [dispatch]);

    if (!ready) return null;

    return <>{children}</>;
};
