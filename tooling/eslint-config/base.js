import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";

const commonIgnores = ["dist", "coverage", "node_modules"];

export function createBaseConfig({ files = ["**/*.{ts,tsx}"], globals } = {}) {
  return defineConfig([
    globalIgnores(commonIgnores),
    {
      files,
      extends: [js.configs.recommended, tseslint.configs.recommended, eslintConfigPrettier],
      languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        globals
      }
    }
  ]);
}

export { commonIgnores };
