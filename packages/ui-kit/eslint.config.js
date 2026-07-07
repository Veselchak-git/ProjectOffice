/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import reactLibraryConfig from "@helpdesk-portal/eslint-config/react-library";
import storybook from "eslint-plugin-storybook";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
    globalIgnores(["storybook-static"]),
    ...reactLibraryConfig,
    ...storybook.configs["flat/recommended"]
]);
