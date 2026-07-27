/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { vi } from "vitest";

configure({ testIdAttribute: "data-test" });

// ── react-i18next mock ───────────────────────────────────────────────────────
// Переопределяем модуль, чтобы useTranslation() не требовал реального i18n-инстанса.
vi.mock("react-i18next", () => {
    const t = (key: string, options?: Record<string, string>) => {
        const translations: Record<string, string> = {
            "filter.title": "Фильтр",
            "filter.apply": "Применить",
            "filter.reset": "Сбросить",
            "filter.clearAll": "Сбросить всё",
            "filter.placeholder.select": "Выберите...",
            "filter.placeholder.value": "Введите значение...",
            "filter.removeAria": "Удалить фильтр: {{label}}",
            "filter.logic.AND": "И",
            "filter.logic.OR": "ИЛИ",
            "filter.operator.contains": "Содержит",
            "filter.operator.not_contains": "Не содержит",
            "filter.operator.starts_with": "Начинается с",
            "filter.operator.eq": "Точное совпадение",
            "filter.operator.in": "В списке",
            "filter.operator.not_in": "Не в списке",
            "filter.operator.after": "После",
            "filter.operator.before": "До",
            "filter.selectedCount": "Выбрано: {{count}}"
        };
        let result = translations[key] ?? key;
        if (options) {
            Object.entries(options).forEach(([k, v]) => {
                result = result.replace(`{{${k}}}`, v);
            });
        }
        return result;
    };
    return {
        useTranslation: () => ({
            t,
            i18n: { language: "ru", changeLanguage: vi.fn() }
        })
    };
});
