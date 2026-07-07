/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  "packages/ui-kit/**/*.{ts,tsx,js,jsx}": [
    "npm run lint --workspace=@helpdesk-portal/ui-kit -- --fix",
    "npm run format --workspace=@helpdesk-portal/ui-kit",
    () => "npm run type-check --workspace=@helpdesk-portal/ui-kit",
  ],
  "apps/frontend/**/*.{ts,tsx,js,jsx}": [
    "npm run lint --workspace=frontend -- --fix",
    "npm run format --workspace=frontend",
    () => "npm run type-check --workspace=frontend",
  ],
  "packages/i18n/**/*.{ts,tsx,js,jsx}": [
    "npm run lint --workspace=@helpdesk-portal/i18n -- --fix",
    "npm run format --workspace=@helpdesk-portal/i18n",
    () => "npm run type-check --workspace=@helpdesk-portal/i18n",
  ],
  "apps/localization-server/**/*.{ts,tsx,js,jsx}": [
    "npm run lint --workspace=localization-server -- --fix",
    "npm run format --workspace=localization-server",
    () => "npm run type-check --workspace=localization-server",
  ]
};
