/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { Preview } from "@storybook/react-vite";

import { ThemeDecorator } from "./decorators/ThemeDecorator";
import "./preview.css";

const preview: Preview = {
    globalTypes: {
        theme: {
            description: "Цветовая тема UI Kit",
            toolbar: {
                title: "Тема",
                icon: "contrast",
                items: [
                    { value: "light", title: "Светлая" },
                    { value: "dark", title: "Тёмная" }
                ],
                dynamicTitle: true
            }
        }
    },
    initialGlobals: {
        theme: "light"
    },
    decorators: [ThemeDecorator],
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i
            }
        }
    }
};

export default preview;
