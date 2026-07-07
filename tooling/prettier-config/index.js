/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
/** @type {import('prettier').Config} */
export default {
  tabWidth: 4,
  useTabs: false,
  printWidth: 120,
  arrowParens: "avoid",
  trailingComma: "none",
  endOfLine: "auto",
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  importOrder: [
    "<BUILTIN_MODULES>",
    "<THIRD_PARTY_MODULES>",
    "^@/app",
    "^@/pages",
    "^@/modules",
    "^@/entities",
    "^@/schemas",
    "^@/plugins",
    "^@/shared/lib/(.*)$",
    "^@/shared/ui",
    "^@/shared",
    "^\\.",
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
