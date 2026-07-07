/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import reactLibraryConfig from "@helpdesk-portal/vite-config/react-library";
import { mergeConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import svgr from "vite-plugin-svgr";
import { type ViteUserConfig, defineConfig } from "vitest/config";

import packageJson from "./package.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const peerDependencies = Object.keys(packageJson.peerDependencies ?? {});

const alwaysExternal = [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "react/jsx-dev-runtime",
    "react-dom/client",
];

const externalPackages = Array.from(
    new Set([...peerDependencies, ...alwaysExternal]),
);
const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const external = externalPackages.flatMap((pkg) => [
    pkg,
    new RegExp(`^${escapeRegExp(pkg)}/`),
]);

const iconsConfig = {
    plugins: [
        svgr({
            svgrOptions: {
                svgProps: {
                    fill: "currentColor",
                },
            },
        }),
        viteStaticCopy({
            targets: [
                {
                    src: "src/",
                    dest: ".",
                    rename: { stripBase: 1 },
                },
            ],
        }),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            formats: ["es"],
            cssFileName: "styles",
        },
        rolldownOptions: {
            external,
            output: {
                preserveModules: true,
                preserveModulesRoot: "src",
                entryFileNames: "[name].js",
            },
        },
        minify: "terser",
        sourcemap: true,
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
} satisfies ViteUserConfig;

export default defineConfig(mergeConfig(reactLibraryConfig, iconsConfig));
