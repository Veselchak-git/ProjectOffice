import { format } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { ru } from "date-fns/locale/ru";

import { i18n } from "@/shared/lib/i18n";

const LOCALE_MAP = {
    ru: { fns: ru, date: "dd.MM.yyyy", dateTime: "dd.MM.yyyy HH:mm" },
    en: { fns: enUS, date: "MM/dd/yyyy", dateTime: "MM/dd/yyyy HH:mm" }
} as const;

function getLocale() {
    return LOCALE_MAP[i18n.language as keyof typeof LOCALE_MAP] ?? LOCALE_MAP.en;
}

export function formatDate(isoString: string): string {
    try {
        const { fns, date } = getLocale();
        return format(new Date(isoString), date, { locale: fns });
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
