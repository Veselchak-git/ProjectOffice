/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import queryPlugin from "@tanstack/eslint-plugin-query";
import { defineConfig } from "eslint/config";
import { createBaseConfig } from "./base.js";

export default defineConfig([
  ...createBaseConfig({
    files: ["**/*.{ts,tsx}"],
    globals: globals.browser,
  }),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      ...queryPlugin.configs["flat/recommended"],
    ],
  },
]);
