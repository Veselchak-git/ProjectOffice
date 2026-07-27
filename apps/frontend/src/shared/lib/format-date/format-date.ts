/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { format } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { ru } from "date-fns/locale/ru";

import { i18n } from "@/shared/lib/i18n";

const LOCALE_MAP = {
    ru: { fns: ru, date: "dd.MM.yyyy HH:mm:ss", dateTime: "dd.MM.yyyy HH:mm" },
    en: { fns: enUS, date: "MM/dd/yyyy HH:mm:ss", dateTime: "MM/dd/yyyy HH:mm" }
} as const;

function getLocale() {
    return LOCALE_MAP[i18n.language as keyof typeof LOCALE_MAP] ?? LOCALE_MAP.en;
}

export function formatDate(isoString: string, timeZone?: string): string {
    try {
        /*Как я понял, следующая строчка берёт таймзону автоматически из браузера*/
        const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
        const locale = i18n.language === "ru" ? "ru-RU" : "en-US";
        return new Intl.DateTimeFormat(locale, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            timeZone: tz
        }).format(new Date(isoString));
    } catch {
        return isoString;
    }
}

export function formatDateTime(isoString: string): string {
    try {
        const { fns, dateTime } = getLocale();
        return format(new Date(isoString), dateTime, { locale: fns });
    } catch {
        return isoString;
    }
}
