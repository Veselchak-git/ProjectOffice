/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
/// <reference types="vitest/config" />
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import reactAppConfig from "@helpdesk-portal/vite-config/react-app";
import { defineConfig, mergeConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//TODO добавить vendor splitting
export default mergeConfig(
    reactAppConfig,
    defineConfig({
        resolve: {
            alias: {
                "@": resolve(__dirname, "src")
            }
        },
        server: {
            port: 3000,
            proxy: {
                "/api": {
                    target: process.env.VITE_BACKEND_URL ?? "http://localhost:8442", // Используем переменную окружения
                    secure: false // Отключаем проверку SSL-сертификата
                }
            }
        },
        test: {
            globals: true,
            environment: "jsdom",
            setupFiles: [resolve(__dirname, "src/vitest.setup.ts")],
            css: true
        }
    })
);
