/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

import svgr from "vite-plugin-svgr";

export const svgrPlugin = svgr({
    svgrOptions: {
        svgProps: {
            fill: "currentColor",
        },
    },
});

export default svgrPlugin;
