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

import reactLibraryConfig from "@helpdesk-portal/vite-config/react-library";
import { defineConfig, mergeConfig } from "vite";

import packageJson from "./package.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const peerDependencies = Object.keys(packageJson.peerDependencies ?? {});

const alwaysExternal = ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "react-dom/client"];

const externalPackages = Array.from(new Set([...peerDependencies, ...alwaysExternal]));
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
//нужно, чтобы peerDependencies не попали в dist т.к. они должны быть подключены в приложении consumer,
// по этому мы читаем package и добавляем в external все peerDependencies и alwaysExternal
const external = externalPackages.flatMap(pkg => [pkg, new RegExp(`^${escapeRegExp(pkg)}/`)]);

export default mergeConfig(
    reactLibraryConfig,
    defineConfig({
        build: {
            lib: {
                entry: resolve(__dirname, "src/index.ts"),
                formats: ["es"],
                cssFileName: "styles"
            },
            rolldownOptions: {
                external,
                output: {
                    preserveModules: true,
                    preserveModulesRoot: "src",
                    entryFileNames: "[name].js"
                }
            },
            minify: "terser",
            sourcemap: true
        },
        resolve: {
            alias: {
                "@": resolve(__dirname, "src")
            }
        },
        test: {
            globals: true,
            environment: "jsdom",
            setupFiles: [resolve(__dirname, "src/vitest.setup.ts")],
            css: true,
            testTimeout: 15_000
        }
    })
);
