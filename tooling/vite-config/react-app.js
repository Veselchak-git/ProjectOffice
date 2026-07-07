/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import svgrPlugin from "./svgr.js";

export default defineConfig({
    plugins: [svgrPlugin, react()],
});
