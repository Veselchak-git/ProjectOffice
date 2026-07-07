/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { useSyncExternalStore } from "react";

// читаем значение CSS-переменной
const readCssVar = (varName: string) => getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

const colorModeListeners = new Set<() => void>();
// создаем синглтон для наблюдения за изменением data-color-mode на documentElement
const colorModeObserver = new MutationObserver(() => {
    colorModeListeners.forEach(cb => cb());
});

colorModeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-color-mode"] });

const subscribeToColorMode = (callback: () => void) => {
    colorModeListeners.add(callback);
    return () => colorModeListeners.delete(callback);
};
/**
 * Получить значение CSS-переменной реактивно.
 * Значение обновляется при смене data-color-mode на documentElement. Для стилей использовать css vars напрямую.
 */
export const useCssVar = (varName: string, defaultValue: string = ""): string => {
    return useSyncExternalStore(
        subscribeToColorMode,
        () => readCssVar(varName) || defaultValue,
        () => defaultValue
    );
};
