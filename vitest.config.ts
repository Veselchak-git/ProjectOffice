/*
 * Copyright (c) 2016-2025 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2025 принадлежит ООО Теком
 * Все права защищены
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*", "apps/*"],
  },
});
